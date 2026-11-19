#!/usr/bin/env bash
# ローカル PostgreSQL で SQL テストを実行する（開発者向け・任意）
#   使い方: PGHOST=... PGPORT=... PGUSER=postgres bash supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=quiz_test_$$
psql -q -v ON_ERROR_STOP=1 -c "create database $DB"
trap 'psql -q -c "drop database if exists $DB" >/dev/null' EXIT
P="psql -q -v ON_ERROR_STOP=1 -d $DB"
$P -f supabase/tests/00_local_stub.sql
$P -f supabase/migrations/0001_init.sql 2>/dev/null
$P -f supabase/migrations/0001_init.sql 2>/dev/null   # 2回実行しても壊れないことを確認
$P -f supabase/tests/10_ranking_tests.sql
$P -f supabase/tests/20_rls_tests.sql
bash supabase/tests/30_concurrency.sh "$DB"
