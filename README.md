# みんなの薬学クイズ 💊🧪⭐

大学の授業資料から作った15問クイズを、スマホで何度でも解いて勉強できる Web アプリです。
iPhone の Safari を最優先に作っています。

- Next.js (App Router) / TypeScript / Tailwind CSS v4
- データベース・ログインなし（学習記録は各自のスマホのブラウザに保存）
- GitHub → Vercel で公開

---

## 1. できること

- 科目一覧 → 問題セット一覧 → 15問クイズ（4択・○×・穴埋め、出題順は固定）
- 1問ごとに正解・不正解と解説を表示。確定した回答は変更不可
- 途中で Safari を閉じても、同じ端末なら「続きから再開」／「最初からやり直す」を選べる
- 問題セット一覧：自分の平均正答率・取り組んだ回数・最後に取り組んだ日（今日／昨日／N日前）
- 結果画面：今回の得点・正答率、これまでの平均正答率と完了回数、前回の平均との差、全15問の復習
- 平均正答率 ＝ 累計正解数 ÷（15 × 完了回数）× 100。低い点も消さずに累計。途中でやめた挑戦は含めない

### 記録の保存について

記録は**その端末・そのブラウザの中だけ**に保存されます（サーバーには送りません）。
機種変更・別ブラウザ・Safari の「履歴とWebサイトデータを消去」・プライベートブラウズでは記録は残りません。友達同士で記録が共有されることもありません。

> 問題と正答はページのデータに含まれるため、技術的にはブラウザの開発者ツールで見ることができます。自習用なので問題ありませんが、念のため知っておいてください。

---

## 2. フォルダ構成

```
content/
  subjects.ts                 科目の一覧（ここに1行足せば科目追加）
  quiz-sets/
    index.ts                  問題セットの登録簿
    <id>.v<版>.json           問題・選択肢・正答・解説
src/
  app/                        画面
  components/                 部品（問題表示・ボタン・演出）
  lib/                        記録の保存・正答率の計算・問題データの検査
docs/ADDING_QUIZ.md           問題追加の詳しい手順（Claude向け）
```

---

## 3. はじめての公開手順（初心者向け）

所要時間の目安：20〜30分。必要なもの：パソコン、GitHub アカウント。**環境変数やデータベースの設定は不要**です。

### 3-1. パソコンの準備と動作確認

1. **Node.js**（LTS版、20以上）を https://nodejs.org からインストール。
2. このフォルダをデスクトップなどに置き、ターミナル（Mac：「ターミナル」アプリ）で：
   ```bash
   cd ~/Desktop/minna-yakugaku-quiz
   npm install
   npm run dev
   ```
3. ブラウザで http://localhost:3000 を開き、サンプルクイズが解ければ成功。
   同じWi-FiのiPhoneから試す場合は、ターミナルに表示される `Network: http://192.168.x.x:3000` を開く。

### 3-2. GitHub にアップロード

1. https://github.com/new で新しいリポジトリを作成（名前例：`minna-yakugaku-quiz`、**Private 推奨**）。
2. ターミナルで（`あなたのID` を置き換え）：
   ```bash
   git remote add origin https://github.com/あなたのID/minna-yakugaku-quiz.git
   git push -u origin main
   ```
   （このフォルダは最初のコミット済みです。もし `git` のエラーが出たら、`git init` → `git add .` → `git commit -m "最初のバージョン"` → `git branch -M main` を先に実行）

### 3-3. Vercel で公開

1. https://vercel.com に **GitHub アカウントでサインアップ**。
2. **Add New → Project** → 先ほどのリポジトリを **Import** → そのまま **Deploy**。
3. 数分で `https://xxxx.vercel.app` のURLが発行されます。

以後は GitHub に push するたびに Vercel が自動で更新します。

### 3-4. 公開前チェックリスト

- [ ] iPhone Safari で クイズ → 結果 → 全問復習 まで動く
- [ ] クイズ途中で Safari を閉じ、開き直して「続きから再開」できる
- [ ] 2回目を解くと平均正答率と完了回数が更新される
- [ ] 本番用の問題セットを追加したら、サンプルを非表示にする（6章）

---

## 4. 新しい問題セットの追加

1. Claude のチャットに授業資料（PDFなど）を送り、「この授業資料から15問のクイズを作成して追加して」と依頼。
2. Claude が15問（問題・選択肢・正答・解説・根拠ページ）を一覧で提示 → **あなたが全問確認**。
3. 公開を許可すると、Claude が `content/quiz-sets/` に JSON を追加し `index.ts` に登録。
4. `npm run validate:quizzes` で形式チェック（`npm run build` でも自動実行。エラーがあると公開されません）。
5. GitHub に push → Vercel が自動更新。

既に公開した問題を直すときは、**新しいバージョンのファイルを追加**します（過去の挑戦の復習が崩れないように）。詳細は [docs/ADDING_QUIZ.md](docs/ADDING_QUIZ.md)。

### 手作業で追加する場合

```bash
# 1. JSON を content/quiz-sets/ に置く（例 basic-pharmacology-06.v1.json）
# 2. content/quiz-sets/index.ts に追記
#      import basic_pharmacology_06_v1 from "./basic-pharmacology-06.v1.json";
#      … QUIZ_SET_FILES の配列に basic_pharmacology_06_v1, を追加
npm run validate:quizzes
git add . && git commit -m "基礎薬理学 第6回を追加" && git push
```

科目を増やすときは `content/subjects.ts` に1行追加します。

---

## 5. テスト

```bash
npm test                  # 正答率の計算・記録の保存ルール・採点・問題データ検査
npm run validate:quizzes  # 問題データの形式チェック
npm run typecheck         # 型チェック
```

---

## 6. サンプルの削除

サンプル（科目「動作確認用サンプル」）は本番の問題と区別して表示されています。

- **非表示にするだけ**：Vercel の Settings → Environment Variables に `HIDE_SAMPLE_SETS` = `true` を追加して再デプロイ。
- **完全に削除**：`content/quiz-sets/sample-pharmacology-basics.v1.json` を削除し、`index.ts` の該当2行と、`content/subjects.ts` の `sample` の行を削除。
