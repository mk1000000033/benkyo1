// npm test で実行（Node.js 組み込みのテストランナー）
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareRates, formatDelta, formatPercent } from "../src/lib/stats";
import { addAnswer, addCompletedAttempt, MAX_STORED_ATTEMPTS, type Progress, type SetRecord } from "../src/lib/records";
import { gradeAnswer } from "../src/lib/grade";
import { validateQuizSet } from "../src/lib/quiz-validate";
import type { QuizSetFile } from "../src/lib/quiz-types";
import sample from "../content/quiz-sets/natural-products-2024-q2.v1.json";

/** k問正解で15問回答済みの進行状態 */
function finished(id: string, k: number): Progress {
  return {
    attemptId: id, setId: "s", version: 1, questionCount: 15, currentIndex: 14, startedAt: "t",
    answers: Array.from({ length: 15 }, (_, i) => ({ index: i, answer: "a", isCorrect: i < k })),
  };
}
function play(rec: SetRecord | null, id: string, k: number) {
  return addCompletedAttempt(rec, finished(id, k), "2026-11-19T00:00:00Z");
}

test("平均正答率：仕様の例 12 → 9 → 15 で 80%", () => {
  let r = play(null, "1", 12).record;
  assert.equal(formatPercent(r.totalCorrect, r.totalQuestions), "80.0");
  r = play(r, "2", 9).record;
  assert.equal(formatPercent(r.totalCorrect, r.totalQuestions), "70.0"); // 下がる
  r = play(r, "3", 15).record;
  assert.equal(r.attemptsCount, 3);
  assert.equal(r.totalCorrect, 36);
  assert.equal(formatPercent(r.totalCorrect, r.totalQuestions), "80.0");
});

test("同じ挑戦を2回完了しても1回分だけ（二重タップ対策）", () => {
  const first = play(null, "x", 10);
  const again = addCompletedAttempt(first.record, finished("x", 10), "later");
  assert.equal(again.added, false);
  assert.equal(again.record.attemptsCount, 1);
  assert.equal(again.record.totalCorrect, 10);
});

test("未完了の挑戦は記録できない", () => {
  const p = finished("y", 5);
  p.answers = p.answers.slice(0, 14);
  assert.throws(() => addCompletedAttempt(null, p, "t"));
});

test("結果画面用に直前の累計を保存", () => {
  const r1 = play(null, "1", 12).record;
  const { attempt } = play(r1, "2", 9);
  assert.deepEqual(attempt.prev, { attemptsCount: 1, totalCorrect: 12, totalQuestions: 15 });
  assert.equal(formatDelta(12, 15, 21, 30), "−10.0");
});

test("詳細は直近だけ残すが、累計は消さない", () => {
  let r: SetRecord | null = null;
  for (let i = 0; i < MAX_STORED_ATTEMPTS + 5; i++) r = play(r, String(i), 15).record;
  assert.equal(r!.attempts.length, MAX_STORED_ATTEMPTS);
  assert.equal(r!.attemptsCount, MAX_STORED_ATTEMPTS + 5);
});

test("確定済みの回答は変更できない・順番飛ばしは無視", () => {
  let p: Progress = { ...finished("z", 0), currentIndex: 0, answers: [] };
  p = addAnswer(p, { index: 0, answer: "a", isCorrect: true });
  const again = addAnswer(p, { index: 0, answer: "b", isCorrect: false });
  assert.equal(again, p);
  assert.equal(addAnswer(p, { index: 5, answer: "a", isCorrect: true }), p);
});

test("採点", () => {
  const set = sample as unknown as QuizSetFile;
  const choice = set.questions.find((q) => q.type === "choice")!;
  if (choice.type !== "choice") throw new Error("unreachable");
  const wrong = choice.options.find((o) => o.id !== choice.answer)!.id;
  assert.equal(gradeAnswer(choice, choice.answer), true);
  assert.equal(gradeAnswer(choice, wrong), false);
  assert.equal(gradeAnswer(choice, "zzz"), null);
  const tf = set.questions.find((q) => q.type === "truefalse")!;
  assert.equal(gradeAnswer(tf, tf.answer), true); // ○×
  assert.equal(gradeAnswer(tf, "a"), null);
});

test("表示：小数第1位・厳密比較", () => {
  assert.equal(formatPercent(1, 3), "33.3");
  assert.equal(formatPercent(2, 3), "66.7");
  assert.equal(formatPercent(1, 8), "12.5");
  assert.equal(compareRates(12, 15, 24, 30), 0);
  assert.equal(compareRates(2001, 3000, 2000, 2999), 1);
  assert.equal(formatDelta(36, 45, 48, 60), "±0.0");
  assert.equal(formatDelta(1, 3, 1, 2), "+16.7");
});

test("問題データの検査：サンプルは合格・壊れたデータは不合格", () => {
  const ids = ["natural-products"];
  assert.deepEqual(validateQuizSet(sample, ids), []);
  const broken = structuredClone(sample) as any;
  broken.questions.find((q: any) => q.type === "choice").answer = "z";
  broken.questions.find((q: any) => q.type === "fill").prompt = "空欄なし";
  broken.questions.pop();
  const errs = validateQuizSet(broken, ids);
  assert.ok(errs.some((e) => e.includes("answer が選択肢ID")));
  assert.ok(errs.some((e) => e.includes("[[blank]]")));
  assert.ok(errs.some((e) => e.includes("10〜20問")) === false); // 14問は範囲内
  broken.questions = broken.questions.slice(0, 9);
  assert.ok(validateQuizSet(broken, ids).some((e) => e.includes("10〜20問")));
});

import { formatLastDate } from "../src/lib/dates";
import { lastCompletedAt } from "../src/lib/records";

test("取り組んだ回数と最後に取り組んだ日", () => {
  const r1 = addCompletedAttempt(null, finished("1", 10), "2026-11-17T10:00:00+09:00").record;
  const r2 = addCompletedAttempt(r1, finished("2", 12), "2026-11-19T09:00:00+09:00").record;
  assert.equal(r2.attemptsCount, 2);
  assert.equal(lastCompletedAt(r2), "2026-11-19T09:00:00+09:00");
  // 古い形式（lastCompletedAt なし）の記録でも最後の挑戦から求める
  const { lastCompletedAt: _, ...old } = r2;
  assert.equal(lastCompletedAt(old as SetRecord), "2026-11-19T09:00:00+09:00");
  assert.equal(lastCompletedAt(null), null);
});

test("日付の表示（今日・昨日・N日前・年またぎ）", () => {
  // 端末のタイムゾーンに依存しないよう、ローカル時刻で日付を作る
  const local = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
  const now = new Date(2026, 10, 19, 20, 0);
  assert.deepEqual(formatLastDate(local(2026, 11, 19, 0, 30), now), { date: "11月19日（木）", relative: "今日" });
  assert.deepEqual(formatLastDate(local(2026, 11, 18, 23, 59), now), { date: "11月18日（水）", relative: "昨日" });
  assert.equal(formatLastDate(local(2026, 11, 12, 12), now).relative, "7日前");
  assert.equal(formatLastDate(local(2025, 12, 31, 12), now).date, "2025年12月31日（水）");
});

import { validateNote } from "../src/lib/note-validate";
import sampleNote from "../content/notes/natural-products-2024-q2.json";

test("まとめの検査：サンプルは合格・壊れたデータは不合格", () => {
  assert.deepEqual(validateNote(sampleNote, ["natural-products-2024-q2"]), []);
  assert.ok(validateNote(sampleNote, ["other"]).some((e) => e.includes("setId")));
  const broken = structuredClone(sampleNote) as any;
  broken.sections.flatMap((s: any) => s.blocks).find((b: any) => b.type === "table").rows[0] = ["列が足りない"];
  broken.sections[1].blocks.push({ type: "video", url: "x" });
  const errs = validateNote(broken, ["natural-products-2024-q2"]);
  assert.ok(errs.some((e) => e.includes("列数")));
  assert.ok(errs.some((e) => e.includes('"video"')));
});

import { groupSets, titleInGroup } from "../src/lib/groups";

test("年度フォルダ：新しい年度が上・フォルダなしは最後", () => {
  const sets = [
    { id: "a", group: "2023年度 中間試験" }, { id: "b", group: "2024年度 中間試験" },
    { id: "c", group: null }, { id: "d", group: "2023年度 中間試験" }, { id: "e", group: "2024年度 期末試験" },
  ];
  const g = groupSets(sets);
  assert.deepEqual(g.map((x) => x.name), ["2024年度 中間試験", "2024年度 期末試験", "2023年度 中間試験", null]);
  assert.deepEqual(g[2].sets.map((x) => x.id), ["a", "d"]); // フォルダ内の順番は保つ
  assert.equal(titleInGroup("2024年度 大問2 脂肪酸", "2024年度 中間試験"), "大問2 脂肪酸");
  assert.equal(titleInGroup("2024年度 大問2 脂肪酸", "2023年度 中間試験"), "2024年度 大問2 脂肪酸");
  assert.equal(titleInGroup("第6回 自律神経", null), "第6回 自律神経");
});

import { addToLog, dateKey, logFromRecords, series, streak, totals } from "../src/lib/daily";

test("日ごとの学習記録：集計・空白日・連続日数", () => {
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);
  let log = {};
  log = addToLog(log, dateKey(d(2026, 11, 17)), true);
  log = addToLog(log, dateKey(d(2026, 11, 17)), false);
  log = addToLog(log, dateKey(d(2026, 11, 18)), true);
  log = addToLog(log, dateKey(d(2026, 11, 19)), true);
  const pts = series(log, d(2026, 11, 19), 5);
  assert.deepEqual(pts.map((p) => p.date), ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]);
  assert.deepEqual(pts.map((p) => p.answered), [0, 0, 2, 1, 1]);
  assert.equal(pts[2].rate, 50);
  assert.equal(pts[0].rate, null);
  assert.deepEqual(totals(pts), { answered: 4, correct: 3, activeDays: 3 });
  assert.equal(streak(log, d(2026, 11, 19)), 3);
  assert.equal(streak(log, d(2026, 11, 20)), 3); // 今日まだでも昨日まで続いていれば連続中
  assert.equal(streak(log, d(2026, 11, 21)), 0);
  // 月をまたぐ
  assert.deepEqual(series({}, d(2026, 12, 2), 3).map((p) => p.date), ["2026-11-30", "2026-12-01", "2026-12-02"]);
});

test("これまでの挑戦から日ごとの記録を補完", () => {
  const r1 = addCompletedAttempt(null, finished("1", 12), new Date(2026, 10, 17, 21).toISOString()).record;
  const r2 = addCompletedAttempt(r1, finished("2", 9), new Date(2026, 10, 18, 8).toISOString()).record;
  const log = logFromRecords([r2]);
  assert.deepEqual(log["2026-11-17"], { answered: 15, correct: 12 });
  assert.deepEqual(log["2026-11-18"], { answered: 15, correct: 9 });
});

import { shuffle } from "../src/lib/shuffle";
import { questionToCard } from "../src/lib/cards";
import { cardsComment, greeting, resultComment } from "../src/lib/iincho";

test("シャッフル：同じ中身で順番だけ変わる", () => {
  const a = Array.from({ length: 30 }, (_, i) => i);
  const b = shuffle(a);
  assert.deepEqual([...b].sort((x, y) => x - y), a);
  assert.notDeepEqual(b, a); // 30! 分の1 で偶然一致するだけ
  assert.deepEqual(a[0], 0); // 元の配列は変えない
});

test("暗記カード：問題をカードにする", () => {
  const set = sample as unknown as QuizSetFile;
  const fill = set.questions.find((q) => q.type === "fill")!;
  const card = questionToCard("x", fill, "セット");
  assert.ok(card.front.includes("（　　）") && !card.front.includes("[[blank]]"));
  assert.ok(card.back.length > 0);
  const tf = questionToCard("y", set.questions.find((q) => q.type === "truefalse")!, "セット");
  assert.match(tf.back, /^[○×]/);
});

test("委員長：点数でセリフと表情が変わる・同じ挑戦なら同じセリフ", () => {
  assert.equal(resultComment(100, "a").mood, "proud");
  assert.equal(resultComment(85, "a").mood, "proud");
  assert.equal(resultComment(70, "a").mood, "ok");
  assert.equal(resultComment(30, "a").mood, "worried");
  assert.equal(resultComment(70, "abc").line, resultComment(70, "abc").line);
  assert.equal(greeting(new Date(2026, 10, 19, 2), 0).mood, "sleepy");
  assert.match(greeting(new Date(2026, 10, 19, 15), 5).line, /5日連続/);
  assert.equal(cardsComment(10, 10, "s").mood, "proud");
});

test("すべての問題にテーマが付いている（天然物化学）", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  for (const f of readdirSync("content/quiz-sets").filter((x) => x.startsWith("natural-products") && x.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(`content/quiz-sets/${f}`, "utf8"));
    for (const q of d.questions) assert.ok(q.tags?.length > 0, `${f} ${q.id} にテーマがない`);
  }
});
