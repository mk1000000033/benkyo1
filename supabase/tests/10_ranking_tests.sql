-- 集計ロジックの自動テスト（ローカル PostgreSQL 用）
-- 失敗すると例外で止まります。最後に「ALL SQL TESTS PASSED」と表示されれば成功。
\set ON_ERROR_STOP on
set role service_role;

-- テスト用ヘルパー：k 問正解で 15 問すべて回答して完了する
create or replace function pg_temp.play(p_user uuid, p_set text, p_k int, p_complete bool default true)
returns uuid language plpgsql as $$
declare a public.attempts; i int;
begin
  a := public.start_attempt(p_user, p_set, 1, 15, 'new');
  for i in 0..14 loop
    perform public.record_answer(a.id, p_user, i, 'q' || i, 'choice', '"a"', '"a"', i < p_k);
    if i < 14 then perform public.advance_attempt(a.id, p_user, i + 1); end if;
  end loop;
  if p_complete then perform public.complete_attempt(a.id, p_user); end if;
  return a.id;
end $$;

reset role;
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c'), ('00000000-0000-0000-0000-00000000000d');
insert into public.participants (id, nickname) values
  ('00000000-0000-0000-0000-00000000000a', 'たろう'),
  ('00000000-0000-0000-0000-00000000000b', 'たろう'),           -- 同じニックネームの別人
  ('00000000-0000-0000-0000-00000000000c', 'はなこ'),
  ('00000000-0000-0000-0000-00000000000d', 'じろう');
insert into public.quiz_sets (set_id, version, subject_id, subject_name, title, question_count)
values ('t1', 1, 's', 'テスト', 'テストセット', 15);
set role service_role;

do $$
declare
  A uuid := '00000000-0000-0000-0000-00000000000a';
  B uuid := '00000000-0000-0000-0000-00000000000b';
  C uuid := '00000000-0000-0000-0000-00000000000c';
  D uuid := '00000000-0000-0000-0000-00000000000d';
  l public.leaderboard; r1 timestamptz; att uuid; x public.attempts; res jsonb;
begin
  -- 1) 初回挑戦：12/15 → 80%
  perform pg_temp.play(A, 't1', 12);
  select * into l from public.leaderboard where participant_id = A and set_id = 't1';
  assert l.attempts_count = 1 and l.total_correct = 12 and l.total_questions = 15, '初回の集計';
  assert l.average_percent = 80, '初回 80%';
  r1 := l.reached_at;

  -- 2) 仕様の例：12, 9, 15 → 36/45 = 80%（平均は変わらない → 到達日時を維持）
  perform pg_temp.play(A, 't1', 9);
  select * into l from public.leaderboard where participant_id = A and set_id = 't1';
  assert l.total_correct = 21 and l.attempts_count = 2 and l.average_percent = 70, '2回目 70%';
  assert l.reached_at > r1, '平均が変わったら到達日時を更新';
  perform pg_temp.play(A, 't1', 15);
  select * into l from public.leaderboard where participant_id = A and set_id = 't1';
  assert l.total_correct = 36 and l.attempts_count = 3 and l.average_percent = 80, '3回目 80%（仕様例）';
  r1 := l.reached_at;
  perform pg_temp.play(A, 't1', 12);   -- 12/15 = 80% → 平均 48/60 = 80% のまま
  select * into l from public.leaderboard where participant_id = A and set_id = 't1';
  assert l.average_percent = 80 and l.attempts_count = 4, '4回目も80%';
  assert l.reached_at = r1, '平均が変わらなければ到達日時を維持';

  -- 3) 再挑戦で平均が下がる
  perform pg_temp.play(A, 't1', 0);
  select * into l from public.leaderboard where participant_id = A and set_id = 't1';
  assert l.total_correct = 48 and l.total_questions = 75, '低得点も削除せず集計';

  -- 4) 未完了の挑戦は集計に入らない
  att := pg_temp.play(C, 't1', 15, false);
  assert not exists (select 1 from public.leaderboard where participant_id = C), '未完了は集計外';
  -- resume は同じ進行中の挑戦を返すので、15問回答済み → 完了できる
  x := public.start_attempt(C, 't1', 1, 15, 'resume');
  assert x.id = att, 'resume は同じ挑戦を返す';
  perform public.complete_attempt(x.id, C);
  select * into l from public.leaderboard where participant_id = C;
  assert l.attempts_count = 1 and l.total_correct = 15, '再開して完了した分だけ集計';

  -- 途中で「最初からやり直す」→ 旧挑戦は abandoned（削除しない）・集計外
  x := public.start_attempt(D, 't1', 1, 15, 'new');
  perform public.record_answer(x.id, D, 0, 'q0', 'choice', '"a"', '"a"', true);
  x := public.start_attempt(D, 't1', 1, 15, 'new');
  assert (select count(*) from public.attempts where participant_id = D and status = 'abandoned') = 1, '中断は保存';
  assert not exists (select 1 from public.leaderboard where participant_id = D), '中断は集計外';
  begin
    perform public.complete_attempt(x.id, D);
    assert false, '未回答のまま完了できてはいけない';
  exception when others then
    assert sqlerrm = 'not_finished', '未回答の完了は not_finished: ' || sqlerrm;
  end;

  -- 5) 二重送信：同じ回答の再送・完了の再送で数が増えない
  att := pg_temp.play(B, 't1', 10, false);
  perform public.record_answer(att, B, 14, 'q14', 'choice', '"b"', '"a"', false); -- 再送（中身が違っても無視）
  x := public.record_answer(att, B, 3, 'q3', 'choice', '"b"', '"a"', false);
  assert x.correct_count = 10 and jsonb_array_length(x.answers) = 15, '回答の再送は無視';
  res := public.complete_attempt(att, B);
  res := public.complete_attempt(att, B);
  assert (res ->> 'alreadyCompleted')::boolean, '2回目の完了は alreadyCompleted';
  select * into l from public.leaderboard where participant_id = B;
  assert l.attempts_count = 1 and l.total_correct = 10, '完了の二重送信で回数が増えない';

  -- 6) 順番を飛ばした回答は拒否
  x := public.start_attempt(B, 't1', 1, 15, 'new');
  begin
    perform public.record_answer(x.id, B, 5, 'q5', 'choice', '"a"', '"a"', true);
    assert false, '飛ばし回答が通ってはいけない';
  exception when others then
    assert sqlerrm = 'out_of_order', 'out_of_order: ' || sqlerrm;
  end;

  -- 7) 他人の挑戦は操作できない
  begin
    perform public.record_answer(x.id, A, 0, 'q0', 'choice', '"a"', '"a"', true);
    assert false, '他人の挑戦に回答できてはいけない';
  exception when others then
    assert sqlerrm = 'attempt_not_found', 'attempt_not_found: ' || sqlerrm;
  end;

  -- 8) 整合性ビュー：集計と履歴が一致
  assert not exists (select 1 from public.leaderboard_consistency where not ok), '集計と履歴が一致';
  raise notice 'ALL SQL TESTS PASSED';
end $$;
