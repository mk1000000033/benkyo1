// 問題データの検査:  npm run validate:quizzes
//   ・content/quiz-sets/*.json の形式（10〜20問・3形式混在・正答が選択肢にある 等）
//   ・すべての JSON が content/quiz-sets/index.ts に登録されているか
//   ・同じ id/version の重複がないか
// ビルド（npm run build）の前にも自動で実行され、エラーがあれば公開されません。
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SUBJECTS } from "../content/subjects";
import { validateQuizSet } from "../src/lib/quiz-validate";
import { validateNote } from "../src/lib/note-validate";
import { themesOf } from "../content/themes";

const dir = join(process.cwd(), "content", "quiz-sets");
const indexSrc = readFileSync(join(dir, "index.ts"), "utf8");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const subjectIds = SUBJECTS.map((s) => s.id);

let failed = false;
const seen = new Map<string, string>();
const counts: Record<string, number> = {};

for (const file of files) {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  } catch (e) {
    console.error(`✗ ${file}: JSONとして読み込めません (${(e as Error).message})`);
    failed = true;
    continue;
  }
  const errors = validateQuizSet(data, subjectIds);
  const d = data as { id?: string; version?: number; questions?: { type: string }[] };
  const key = `${d.id}@${d.version}`;
  if (seen.has(key)) errors.push(`${file}: ${key} は ${seen.get(key)} と重複しています`);
  seen.set(key, file);
  if (!indexSrc.includes(`./${file}`)) errors.push(`${file}: content/quiz-sets/index.ts に登録されていません`);
  const themeIds = themesOf((data as { subjectId?: string }).subjectId ?? "").map((t) => t.id);
  for (const q of (data as { questions?: { id: string; tags?: string[]; image?: { src?: string } | null }[] }).questions ?? []) {
    for (const t of q.tags ?? []) if (!themeIds.includes(t)) errors.push(`${file} ${q.id}: テーマ "${t}" が content/themes.ts にありません`);
    const src = q.image?.src;
    if (src && !existsSync(join(process.cwd(), "public", src))) errors.push(`${file} ${q.id}: 画像 public${src} がありません`);
  }
  const expectedName = `${d.id}.v${d.version}.json`;
  if (file !== expectedName) errors.push(`${file}: ファイル名は "${expectedName}" にしてください`);

  if (errors.length) {
    failed = true;
    console.error(`✗ ${file}`);
    for (const e of errors) console.error(`   - ${e}`);
  } else {
    const types = (d.questions ?? []).reduce<Record<string, number>>((acc, q) => ((acc[q.type] = (acc[q.type] ?? 0) + 1), acc), {});
    console.log(`✓ ${file}  (4択 ${types.choice ?? 0} / ○× ${types.truefalse ?? 0} / 穴埋め ${types.fill ?? 0})`);
    counts[d.id ?? ""] = (counts[d.id ?? ""] ?? 0) + 1;
  }
}

// index.ts に書かれているのにファイルが無いもの
for (const m of indexSrc.matchAll(/from\s+"\.\/([^"]+\.json)"/g)) {
  if (!files.includes(m[1])) {
    console.error(`✗ index.ts が存在しないファイルを読み込んでいます: ${m[1]}`);
    failed = true;
  }
}

// ---- まとめ（content/notes） ----
const noteDir = join(process.cwd(), "content", "notes");
const noteIndex = readFileSync(join(noteDir, "index.ts"), "utf8");
const noteFiles = readdirSync(noteDir).filter((f) => f.endsWith(".json")).sort();
const setIds = Object.keys(counts);
for (const file of noteFiles) {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(join(noteDir, file), "utf8"));
  } catch (e) {
    console.error(`✗ notes/${file}: JSONとして読み込めません (${(e as Error).message})`);
    failed = true;
    continue;
  }
  const errors = validateNote(data, setIds);
  const id = (data as { setId?: string }).setId;
  if (file !== `${id}.json`) errors.push(`ファイル名は "${id}.json" にしてください`);
  if (!noteIndex.includes(`./${file}`)) errors.push(`content/notes/index.ts に登録されていません`);
  if (errors.length) {
    failed = true;
    console.error(`✗ notes/${file}`);
    for (const e of errors) console.error(`   - ${e}`);
  } else {
    const n = data as { sections: unknown[] };
    console.log(`✓ notes/${file}  (${n.sections.length}セクション)`);
  }
}
for (const m of noteIndex.matchAll(/from\s+"\.\/([^"]+\.json)"/g)) {
  if (!noteFiles.includes(m[1])) {
    console.error(`✗ notes/index.ts が存在しないファイルを読み込んでいます: ${m[1]}`);
    failed = true;
  }
}

if (failed) {
  console.error("\n問題データにエラーがあります。上のメッセージを確認してください。");
  process.exit(1);
}
console.log(`\nOK：問題 ${files.length}ファイル（${Object.keys(counts).length}セット）・まとめ ${noteFiles.length}ファイルを確認しました。`);
