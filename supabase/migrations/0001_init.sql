-- =====================================================================
-- みんなの薬学クイズ  初期スキーマ
--   Supabase の SQL Editor に丸ごと貼り付けて 1 回だけ実行してください。
--   ※ 何度実行しても既存データは消えません（IF NOT EXISTS / OR REPLACE）。
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 参加者（ニックネームは重複OK。識別は Supabase 匿名認証のユーザーID）
-- ---------------------------------------------------------------------
create table if not exists public.participants (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 1 and 16),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 問題セット（メタ情報のみ。問題本文・正答は GitHub の content/ で管理）
--   (set_id, version) で一意。アプリが挑戦開始時に自動で登録・更新する。
-- ---------------------------------------------------------------------
create table if not exists public.quiz_sets (
  set_id          text not null,
  version         integer not null check (version >= 1),
  subject_id      text not null,
  subject_name    text not null,
  title           text not null,
  question_count  integer not null check (question_count > 0),
  is_published    boolean not null default true,
  is_sample       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (set_id, version)
);

-- ---------------------------------------------------------------------
-- 挑戦履歴（未完了・完了・中断すべて保存。削除はしない）
--   answers: [{ "index":0, "questionId":"q01", "type":"choice",
--               "answer":"b", "correctAnswer":"b", "isCorrect":true,
--               "answeredAt":"..." }, ...]
-- ---------------------------------------------------------------------
create table if not exists public.attempts (
  id                    uuid primary key default gen_random_uuid(),
  participant_id        uuid not null references public.participants (id) on delete cascade,
  set_id                text not null,
  set_version           integer not null,
  question_count        integer not null check (question_count > 0),
  status                text not null default 'in_progress'
                          check (status in ('in_progress', 'completed', 'abandoned')),
  answers               jsonb not null default '[]'::jsonb,
  current_index         integer not null default 0,
  correct_count         integer not null default 0,
  started_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  completed_at          timestamptz,
  -- 完了時点の「直前の累計」スナップショット（結果画面の「前回との差」用）
  prev_attempts_count   integer,
  prev_total_correct    integer,
  prev_total_questions  integer,
  foreign key (set_id, set_version) references public.quiz_sets (set_id, version)
);

-- 1人1セットにつき進行中の挑戦は1つだけ
create unique index if not exists attempts_one_in_progress
  on public.attempts (participant_id, set_id) where status = 'in_progress';
create index if not exists attempts_participant_set
  on public.attempts (participant_id, set_id, status);

-- ---------------------------------------------------------------------
-- ランキング集計（問題セットごと・参加者ごと）
--   平均正答率 = total_correct / total_questions  （= 累計正解数 ÷ (15 × 完了回数)）
--   順位の比較はアプリ側で整数のクロス乗算で厳密に行う。
--   average_percent は表示・確認用の参考値（順位計算には使わない）。
-- ---------------------------------------------------------------------
create table if not exists public.leaderboard (
  participant_id   uuid not null references public.participants (id) on delete cascade,
  set_id           text not null,
  attempts_count   integer not null check (attempts_count > 0),
  total_correct    integer not null check (total_correct >= 0),
  total_questions  integer not null check (total_questions > 0),
  average_percent  numeric(9, 4) generated always as
                     (round(total_correct * 100.0 / total_questions, 4)) stored,
  reached_at       timestamptz not null,   -- 現在の平均正答率に初めて到達した日時
  updated_at       timestamptz not null default now(),
  primary key (participant_id, set_id),
  check (total_correct <= total_questions)
);
create index if not exists leaderboard_set on public.leaderboard (set_id);

-- =====================================================================
-- RLS（行レベルセキュリティ）
--   ・書き込みはすべてサーバー（service_role）経由のみ。
--   ・ブラウザ（anon / authenticated）からは読み取りだけ許可。
-- =====================================================================
alter table public.participants enable row level security;
alter table public.quiz_sets    enable row level security;
alter table public.attempts     enable row level security;
alter table public.leaderboard  enable row level security;

revoke insert, update, delete, truncate on public.participants, public.quiz_sets,
  public.attempts, public.leaderboard from anon, authenticated;

drop policy if exists "participants readable" on public.participants;
create policy "participants readable" on public.participants
  for select to authenticated using (true);

drop policy if exists "quiz_sets readable" on public.quiz_sets;
create policy "quiz_sets readable" on public.quiz_sets
  for select to authenticated using (true);

drop policy if exists "own attempts readable" on public.attempts;
create policy "own attempts readable" on public.attempts
  for select to authenticated using (participant_id = (select auth.uid()));

drop policy if exists "leaderboard readable" on public.leaderboard;
create policy "leaderboard readable" on public.leaderboard
  for select to authenticated using (true);

-- =====================================================================
-- サーバー専用の関数（すべて1トランザクション内で原子的に実行）
--   参加者×セット単位でアドバイザリロックを取り、同時実行を直列化する。
-- =====================================================================

-- 挑戦の開始（p_mode = 'resume' なら進行中の挑戦を返す / 'new' なら中断して新規作成）
create or replace function public.start_attempt(
  p_participant uuid, p_set_id text, p_version integer,
  p_question_count integer, p_mode text
) returns public.attempts
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.attempts;
begin
  if p_mode not in ('resume', 'new') then
    raise exception 'invalid_mode';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_participant::text || ':' || p_set_id, 0));

  select * into v_row from public.attempts
   where participant_id = p_participant and set_id = p_set_id and status = 'in_progress'
   for update;

  if found then
    if p_mode = 'resume' and v_row.set_version = p_version then
      return v_row;
    end if;
    -- 「最初からやり直す」or 問題が新バージョンに更新された → 中断扱い（削除はしない）
    update public.attempts set status = 'abandoned', updated_at = now() where id = v_row.id;
  end if;

  insert into public.attempts (participant_id, set_id, set_version, question_count)
  values (p_participant, p_set_id, p_version, p_question_count)
  returning * into v_row;
  return v_row;
end $$;

-- 1問の回答を記録（採点はサーバー側で済ませた結果を渡す）
--   同じ問題への2回目以降の送信は何も変更せず既存の行を返す（冪等）。
create or replace function public.record_answer(
  p_attempt uuid, p_participant uuid, p_index integer, p_question_id text,
  p_type text, p_answer jsonb, p_correct_answer jsonb, p_is_correct boolean
) returns public.attempts
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.attempts;
  v_n   integer;
begin
  select * into v_row from public.attempts
   where id = p_attempt and participant_id = p_participant
   for update;
  if not found then raise exception 'attempt_not_found'; end if;

  v_n := jsonb_array_length(v_row.answers);
  if p_index < v_n then
    return v_row;                       -- 既に確定済み（二重送信）→ 変更しない
  end if;
  if v_row.status <> 'in_progress' then raise exception 'attempt_not_active'; end if;
  if p_index > v_n or p_index <> v_row.current_index then raise exception 'out_of_order'; end if;
  if p_index >= v_row.question_count then raise exception 'index_out_of_range'; end if;

  update public.attempts
     set answers = answers || jsonb_build_array(jsonb_build_object(
           'index', p_index, 'questionId', p_question_id, 'type', p_type,
           'answer', p_answer, 'correctAnswer', p_correct_answer,
           'isCorrect', p_is_correct, 'answeredAt', now())),
         correct_count = correct_count + case when p_is_correct then 1 else 0 end,
         updated_at = now()
   where id = p_attempt
   returning * into v_row;
  return v_row;
end $$;

-- 「次の問題へ」（解説を読み終えたことを記録）
create or replace function public.advance_attempt(
  p_attempt uuid, p_participant uuid, p_to_index integer
) returns public.attempts
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.attempts;
begin
  select * into v_row from public.attempts
   where id = p_attempt and participant_id = p_participant
   for update;
  if not found then raise exception 'attempt_not_found'; end if;
  if v_row.status <> 'in_progress' or p_to_index <= v_row.current_index then
    return v_row;                       -- 二重送信などは無視（冪等）
  end if;
  if p_to_index <> v_row.current_index + 1
     or jsonb_array_length(v_row.answers) < p_to_index
     or p_to_index > v_row.question_count - 1 then
    raise exception 'cannot_advance';
  end if;
  update public.attempts set current_index = p_to_index, updated_at = now()
   where id = p_attempt returning * into v_row;
  return v_row;
end $$;

-- 挑戦の完了 ＋ ランキング集計の更新（原子的・冪等）
create or replace function public.complete_attempt(
  p_attempt uuid, p_participant uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_row      public.attempts;
  v_lb       public.leaderboard;
  v_correct  integer;
  v_n0 integer := 0; v_c0 integer := 0; v_q0 integer := 0;
  v_n1 integer;      v_c1 integer;      v_q1 integer;
  v_reached  timestamptz;
  v_now      timestamptz := clock_timestamp();
begin
  select * into v_row from public.attempts
   where id = p_attempt and participant_id = p_participant;
  if not found then raise exception 'attempt_not_found'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_participant::text || ':' || v_row.set_id, 0));

  select * into v_row from public.attempts where id = p_attempt for update;

  if v_row.status = 'completed' then
    -- 既に完了済み（二重送信）→ 集計を変えずに同じ結果を返す
    return jsonb_build_object('alreadyCompleted', true, 'attemptId', v_row.id);
  end if;
  if v_row.status <> 'in_progress' then raise exception 'attempt_not_active'; end if;
  if jsonb_array_length(v_row.answers) < v_row.question_count then
    raise exception 'not_finished';
  end if;

  -- 正解数は記録済みの回答から再計算（集計の整合性を保証）
  select count(*) into v_correct
    from jsonb_array_elements(v_row.answers) e
   where (e ->> 'isCorrect')::boolean;

  select * into v_lb from public.leaderboard
   where participant_id = p_participant and set_id = v_row.set_id
   for update;

  if found then
    v_n0 := v_lb.attempts_count; v_c0 := v_lb.total_correct; v_q0 := v_lb.total_questions;
  end if;
  v_n1 := v_n0 + 1;
  v_c1 := v_c0 + v_correct;
  v_q1 := v_q0 + v_row.question_count;

  -- 平均正答率が変わらない（c0/q0 = c1/q1 を整数のクロス乗算で厳密比較）なら到達日時を維持
  if found and v_c1::bigint * v_q0 = v_c0::bigint * v_q1 then
    v_reached := v_lb.reached_at;
  else
    v_reached := v_now;
  end if;

  insert into public.leaderboard as l
    (participant_id, set_id, attempts_count, total_correct, total_questions, reached_at, updated_at)
  values (p_participant, v_row.set_id, v_n1, v_c1, v_q1, v_reached, v_now)
  on conflict (participant_id, set_id) do update
    set attempts_count = excluded.attempts_count,
        total_correct = excluded.total_correct,
        total_questions = excluded.total_questions,
        reached_at = excluded.reached_at,
        updated_at = excluded.updated_at;

  update public.attempts
     set status = 'completed', correct_count = v_correct, completed_at = v_now, updated_at = v_now,
         prev_attempts_count = v_n0, prev_total_correct = v_c0, prev_total_questions = v_q0
   where id = p_attempt;

  return jsonb_build_object('alreadyCompleted', false, 'attemptId', v_row.id);
end $$;

-- 権限：これらの関数はサーバー（service_role）からのみ実行可能
revoke all on function public.start_attempt(uuid, text, integer, integer, text) from public, anon, authenticated;
revoke all on function public.record_answer(uuid, uuid, integer, text, text, jsonb, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.advance_attempt(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.complete_attempt(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_attempt(uuid, text, integer, integer, text) to service_role;
grant execute on function public.record_answer(uuid, uuid, integer, text, text, jsonb, jsonb, boolean) to service_role;
grant execute on function public.advance_attempt(uuid, uuid, integer) to service_role;
grant execute on function public.complete_attempt(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------
-- 整合性チェック用ビュー（管理者が SQL Editor で確認する用）
--   select * from public.leaderboard_consistency where not ok;
--   → 0 行なら、集計値と完了済み挑戦履歴が完全に一致しています。
-- ---------------------------------------------------------------------
create or replace view public.leaderboard_consistency
with (security_invoker = true) as
select l.participant_id, l.set_id,
       l.attempts_count, a.cnt as attempts_from_history,
       l.total_correct,  a.correct as correct_from_history,
       l.total_questions, a.questions as questions_from_history,
       (l.attempts_count = a.cnt and l.total_correct = a.correct
        and l.total_questions = a.questions) as ok
  from public.leaderboard l
  left join lateral (
    select count(*)::int as cnt, coalesce(sum(correct_count), 0)::int as correct,
           coalesce(sum(question_count), 0)::int as questions
      from public.attempts t
     where t.participant_id = l.participant_id and t.set_id = l.set_id
       and t.status = 'completed'
  ) a on true;
revoke all on public.leaderboard_consistency from anon, authenticated;
