-- RLS・権限のテスト：ブラウザ側（authenticated / anon）から改ざんできないこと
\set ON_ERROR_STOP on
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;

do $$
declare n int;
begin
  -- 自分の挑戦履歴だけ見える
  select count(*) into n from public.attempts where participant_id <> auth.uid();
  assert n = 0, '他人の挑戦履歴が見えてはいけない';
  select count(*) into n from public.attempts;
  assert n > 0, '自分の挑戦履歴は見える';
  -- ランキングは全員分見える
  select count(distinct participant_id) into n from public.leaderboard;
  assert n >= 2, 'ランキングは共有';

  begin
    update public.leaderboard set total_correct = 999;
    assert false, 'ランキングを書き換えられてはいけない';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.leaderboard (participant_id, set_id, attempts_count, total_correct, total_questions, reached_at)
    values (auth.uid(), 'x', 1, 15, 15, now());
    assert false, 'ランキングに挿入できてはいけない';
  exception when insufficient_privilege then null; end;

  begin
    update public.attempts set correct_count = 15;
    assert false, '挑戦履歴を書き換えられてはいけない';
  exception when insufficient_privilege then null; end;

  begin
    update public.participants set nickname = 'hack';
    assert false, 'ニックネームを直接書き換えられてはいけない';
  exception when insufficient_privilege then null; end;

  begin
    perform public.complete_attempt(gen_random_uuid(), auth.uid());
    assert false, '集計関数を直接呼べてはいけない';
  exception when insufficient_privilege then null; end;

  raise notice 'RLS TESTS PASSED';
end $$;

reset role;
set role anon;
do $$
declare n int;
begin
  select count(*) into n from public.leaderboard;
  assert n = 0, '未ログイン(anon)には何も見えない';
  raise notice 'ANON TESTS PASSED';
end $$;
reset role;
