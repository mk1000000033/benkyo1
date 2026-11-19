#!/usr/bin/env bash
# 同時更新・二重送信テスト：同じリクエストを並列で大量に送っても集計が1回分しか増えないこと
set -euo pipefail
DB="$1"
P="psql -q -t -A -v ON_ERROR_STOP=1 -d $DB"
U='00000000-0000-0000-0000-0000000000ee'
$P -c "insert into auth.users values ('$U'); insert into public.participants (id, nickname) values ('$U', 'へいれつ');"
ATT=$($P -c "set role service_role; select id from public.start_attempt('$U', 't1', 1, 15, 'new');" | tail -1)

# 1問目への回答を 20 並列で送信
for i in $(seq 1 20); do
  $P -c "set role service_role; select 1 from public.record_answer('$ATT', '$U', 0, 'q0', 'choice', '\"a\"', '\"a\"', true);" >/dev/null &
done
wait
N=$($P -c "select jsonb_array_length(answers) || ',' || correct_count from public.attempts where id = '$ATT'")
[ "$N" = "1,1" ] || { echo "FAIL: 並列回答で重複記録 ($N)"; exit 1; }

# 残りを回答
for i in $(seq 1 14); do
  $P -c "set role service_role; select 1 from public.advance_attempt('$ATT', '$U', $i); select 1 from public.record_answer('$ATT', '$U', $i, 'q$i', 'choice', '\"a\"', '\"a\"', $([ $i -lt 9 ] && echo true || echo false));" >/dev/null
done

# 完了を 20 並列で送信
for i in $(seq 1 20); do
  $P -c "set role service_role; select public.complete_attempt('$ATT', '$U');" >/dev/null &
done
wait
R=$($P -c "select attempts_count || ',' || total_correct from public.leaderboard where participant_id = '$U'")
[ "$R" = "1,9" ] || { echo "FAIL: 並列完了で回数が増えた ($R)"; exit 1; }
echo "CONCURRENCY TESTS PASSED (20並列の回答・完了で記録は1回分のみ)"
