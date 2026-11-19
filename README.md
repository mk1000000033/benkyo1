# みんなの薬学クイズ 💊🧪⭐

大学の授業資料から作った15問クイズを友達と解き、**平均正答率**でランキングを競う Web アプリです。
iPhone の Safari を最優先に作っています。

- Next.js (App Router) / TypeScript / Tailwind CSS v4
- Supabase（PostgreSQL・匿名認証・RLS）
- GitHub → Vercel で公開

---

## 目次

1. [仕組みの概要](#1-仕組みの概要)
2. [はじめての公開手順（初心者向け）](#2-はじめての公開手順初心者向け)
3. [新しい問題セットの追加](#3-新しい問題セットの追加)
4. [テスト](#4-テスト)
5. [サンプルの削除](#5-サンプルの削除)
6. [運用メモ・制限事項](#6-運用メモ制限事項)

---

## 1. 仕組みの概要

```
content/
  subjects.ts                 科目の一覧（ここに1行足せば科目追加）
  quiz-sets/
    index.ts                  問題セットの登録簿
    <id>.v<版>.json           問題・選択肢・正答・解説（GitHubで管理）
src/
  app/                        画面と API（/api/...）
  server/                     サーバー専用（正答・採点・DB操作）
  lib/                        共通処理（ランキング計算・入力検証など）
supabase/
  migrations/0001_init.sql    データベースの作成SQL（RLS・集計関数を含む）
  tests/                      SQLの自動テスト
docs/ADDING_QUIZ.md           問題追加の詳しい手順（Claude向け）
```

### 安全性とデータの守り方

| 要件 | 実装 |
|---|---|
| 正答をブラウザに送らない | 問題JSONは `server-only` のモジュールからしか読めず、クライアントバンドルに入りません。正答と解説は**回答を確定した後にだけ**その1問分が返ります |
| 採点はサーバー側 | `/api/attempts/[id]/answer` でサーバーが採点し、DBにも保存 |
| 他人の記録を改ざんできない | RLS有効。ブラウザ（anon/authenticated）からはテーブル・関数へ一切書き込めず、書き込みは service_role キーを持つサーバーだけ |
| 二重送信・同時更新 | DB関数内で行ロック＋アドバイザリロック。同じ回答・完了を何回送っても1回分しか数えません（20並列テスト済み） |
| 平均正答率の正確さ | 累計正解数と累計出題数を整数で保存し、順位比較は分数のクロス乗算で厳密に実施。表示の四捨五入は順位に影響しません |
| 挑戦完了と集計の一貫性 | `complete_attempt` 関数が1トランザクションで「挑戦を完了にする」「集計を更新する」を同時に行います |
| ニックネームのXSS対策 | 16文字以内・制御文字/不可視文字/`<>` 拒否・NFKC正規化（ブラウザとサーバーで同じ検証）。表示はReactが自動エスケープ |

### ランキングのルール

- 平均正答率 ＝ 累計正解数 ÷（15 × 完了した挑戦回数）× 100
- 並び順：①平均正答率が高い ②同率ならその値に先に到達した人 ③参加者ID
- 平均が変わらない再挑戦では「到達日時」は据え置き。未完了・中断した挑戦は集計しません。

---

## 2. はじめての公開手順（初心者向け）

所要時間の目安：30〜60分。必要なもの：パソコン、GitHub アカウント、メールアドレス。

### 2-1. パソコンの準備

1. **Node.js**（LTS版、20以上）を https://nodejs.org からインストール。
2. ターミナル（Mac：「ターミナル」アプリ）で次を実行し、バージョンが表示されればOK。
   ```bash
   node -v
   ```
3. このフォルダ（`minna-yakugaku-quiz`）をデスクトップなどに置き、ターミナルで移動：
   ```bash
   cd ~/Desktop/minna-yakugaku-quiz
   npm install
   ```

### 2-2. Supabase（データベース）の準備

1. https://supabase.com にサインアップ → **New project**。
   - Region は **Northeast Asia (Tokyo)** がおすすめ。Database Password は控えておく。
2. **匿名ログインを有効化**：左メニュー **Authentication → Sign In / Providers**（または Settings）で
   **「Allow anonymous sign-ins」をオン** にして保存。
3. **テーブル作成**：左メニュー **SQL Editor → New query** に
   `supabase/migrations/0001_init.sql` の中身を**全部コピーして貼り付け → Run**。
   「Success」と出ればOK（何度実行しても既存データは消えません）。
   ※ `supabase/tests/` のファイルは本番では実行しないでください。
4. **キーの確認**：**Project Settings → API**（または API Keys）で次の3つをメモ。
   - Project URL
   - anon（public）キー ／ または publishable キー
   - service_role キー ／ または secret キー（**他人に見せない・GitHubに上げない**）

### 2-3. 手元で動かしてみる

1. `.env.example` をコピーして `.env.local` という名前にし、2-2 のキーを書き込む。
2. 起動：
   ```bash
   npm run dev
   ```
3. ブラウザで http://localhost:3000 を開く → ニックネーム入力 → サンプルクイズに挑戦できれば成功。
   同じWi-FiのiPhoneから試す場合は、ターミナルに表示される `Network: http://192.168.x.x:3000` を開く。

### 2-4. GitHub にアップロード

1. https://github.com/new で新しいリポジトリを作成（名前例：`minna-yakugaku-quiz`、**Private 推奨**）。
2. ターミナルで（`あなたのID` を置き換え）：
   ```bash
   git init
   git add .
   git commit -m "最初のバージョン"
   git branch -M main
   git remote add origin https://github.com/あなたのID/minna-yakugaku-quiz.git
   git push -u origin main
   ```
   `.env.local` は `.gitignore` で除外されているので、キーはアップロードされません。

### 2-5. Vercel で公開

1. https://vercel.com に **GitHub アカウントでサインアップ**。
2. **Add New → Project** → 先ほどのリポジトリを **Import**。
3. **Environment Variables** に3つ追加（名前は正確に）：
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable キー |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret キー |
4. **Deploy** を押す。数分で `https://xxxx.vercel.app` のURLが発行されます。
5. 発行されたURLを iPhone で開いて動作確認 → 問題なければ友達にURLを共有。

> 以後は GitHub に push するたびに Vercel が自動で再デプロイします。データベースは Supabase にあるので、再デプロイしても記録・ランキングは消えません。

### 2-6. 公開前チェックリスト

- [ ] iPhone Safari でニックネーム登録 → クイズ → 結果 → ランキングまで動く
- [ ] 別の端末（または別ブラウザ）で同じニックネームを登録し、別人としてランキングに並ぶ
- [ ] クイズ途中で Safari を閉じ、開き直して「続きから再開」できる
- [ ] Supabase の SQL Editor で `select * from public.leaderboard_consistency where not ok;` が0行
- [ ] 本番用の問題セットを追加したら、サンプルを非表示にする（5章）

---

## 3. 新しい問題セットの追加

運用の流れ：

1. Claude のチャットに授業資料（PDFなど）を送り、「この授業資料から15問のクイズを作成して追加して」と依頼。
2. Claude が15問（問題・選択肢・正答・解説・根拠ページ）を一覧で提示 → **あなたが全問確認**。
3. 公開を許可すると、Claude が `content/quiz-sets/` に JSON を追加し `index.ts` に登録。
4. `npm run validate:quizzes` で形式チェック（`npm run build` 時にも自動実行され、エラーがあると公開されません）。
5. GitHub に push → Vercel が自動更新。

**既存の参加者・挑戦履歴・ランキングはデータベースにあるため、問題を追加しても消えません。**
公開済みの問題を直すときは**新しいバージョンのファイルを追加**します。詳細は [docs/ADDING_QUIZ.md](docs/ADDING_QUIZ.md)。

### 手作業で追加する場合

```bash
# 1. JSON を content/quiz-sets/ に置く（例 basic-pharmacology-06.v1.json）
# 2. content/quiz-sets/index.ts に追記
#      import basic_pharmacology_06_v1 from "./basic-pharmacology-06.v1.json";
#      … QUIZ_SET_FILES の配列に basic_pharmacology_06_v1, を追加
# 3. チェック
npm run validate:quizzes
# 4. 公開
git add . && git commit -m "基礎薬理学 第6回を追加" && git push
```

科目を増やすときは `content/subjects.ts` に1行追加します。

---

## 4. テスト

```bash
npm test                  # ランキング計算・ニックネーム検証・問題データ検査
npm run validate:quizzes  # 問題データの形式チェック
npm run typecheck         # 型チェック
```

データベース関数のテスト（PostgreSQL がある開発者向け・任意）：

```bash
PGHOST=localhost PGUSER=postgres bash supabase/tests/run-local.sh
```

内容：初回・再挑戦の平均正答率（仕様例 12→9→15 で80%）、低下時の更新、平均据え置き時の到達日時維持、
未完了・中断が集計に入らないこと、同名別人、二重送信・20並列の同時送信、順番飛ばし拒否、
他人の挑戦の操作拒否、RLS（ブラウザから書き込めない）、集計と履歴の整合性。

---

## 5. サンプルの削除

サンプル（科目「動作確認用サンプル」）は本番の問題と区別されています（`isSample: true`、画面にも表示）。

- **非表示にするだけ**：Vercel の環境変数に `HIDE_SAMPLE_SETS` = `true` を追加して再デプロイ。
- **完全に削除**：
  1. `content/quiz-sets/sample-pharmacology-basics.v1.json` を削除し、`index.ts` の該当2行を削除
  2. `content/subjects.ts` の `sample` の行を削除
  3. サンプルの記録も消す場合は Supabase の SQL Editor で：
     ```sql
     delete from public.leaderboard where set_id = 'sample-pharmacology-basics';
     delete from public.attempts    where set_id = 'sample-pharmacology-basics';
     delete from public.quiz_sets   where set_id = 'sample-pharmacology-basics';
     ```

---

## 6. 運用メモ・制限事項

- **記録の引き継ぎ**：アカウントなしの匿名認証のため、機種変更・ブラウザ変更・Safariのデータ消去・プライベートブラウズ・ホーム画面追加（Safariと別扱い）では新しい参加者になり、記録は引き継げません（設定画面にも表示）。
- **ランキングの更新**：表示中は20秒ごと・アプリに戻ったとき・更新ボタンで最新を取得します（リアルタイム配信ではありません）。
- **匿名ログインの乱用対策**：Supabase の Authentication 設定でレート制限や CAPTCHA を有効にできます（友達同士の利用なら通常は不要）。
- **キーの管理**：service_role キーが漏れた場合は Supabase でキーを再発行し、Vercel の環境変数を更新してください。
- **データのバックアップ**：Supabase 無料プランは一定期間アクセスがないとプロジェクトが一時停止されることがあります。ダッシュボードから再開できます。
