// npm test で実行（Node.js 組み込みのテストランナー）
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareRates, formatDelta, formatPercent, rankRows, toMicros, type RankRow } from "../src/lib/ranking";
import { validateNickname } from "../src/lib/nickname";

const row = (id: string, c: number, n: number, reachedAt: string, nickname = id): RankRow => ({
  participantId: id, nickname, attemptsCount: n, totalCorrect: c, totalQuestions: 15 * n, reachedAt,
});

test("仕様の例：12, 9, 15 → 平均 80%", () => {
  assert.equal(formatPercent(12 + 9 + 15, 15 * 3), "80.0");
});

test("平均正答率の表示は小数第1位（四捨五入）", () => {
  assert.equal(formatPercent(1, 3), "33.3");
  assert.equal(formatPercent(2, 3), "66.7");
  assert.equal(formatPercent(15, 15), "100.0");
  assert.equal(formatPercent(0, 15), "0.0");
  assert.equal(formatPercent(1, 8), "12.5");
});

test("平均の比較は厳密（丸めると同じ表示でも順位は分かれる）", () => {
  // 2001/3000 = 66.70% と 2000/2999 ≈ 66.69% … 表示はどちらも 66.7
  assert.equal(formatPercent(2001, 3000), "66.7");
  assert.equal(formatPercent(2000, 2999), "66.7");
  assert.equal(compareRates(2001, 3000, 2000, 2999), 1);
  // 等しい分数は等しい
  assert.equal(compareRates(12, 15, 24, 30), 0);
});

test("並び順：平均 → 到達日時 → 参加者ID", () => {
  const ranked = rankRows([
    row("p3", 12, 1, "2026-11-19 10:00:00.000002+00"),
    row("p1", 15, 1, "2026-11-19 12:00:00+00"),
    row("p2", 24, 2, "2026-11-19 10:00:00.000001+00"), // 80%（p3と同じ）で先に到達
    row("p5", 12, 1, "2026-11-19 10:00:00.000002+00"), // p3 と完全同着 → IDで安定化
    row("p4", 0, 1, "2026-11-19 09:00:00+00"),
  ]);
  assert.deepEqual(ranked.map((r) => [r.participantId, r.rank]), [
    ["p1", 1], ["p2", 2], ["p3", 3], ["p5", 4], ["p4", 5],
  ]);
});

test("マイクロ秒の差も区別する", () => {
  assert.ok(toMicros("2026-11-19T10:00:00.000001+00:00") < toMicros("2026-11-19T10:00:00.000002+00:00"));
  assert.equal(toMicros("2026-11-19T19:00:00+09:00"), toMicros("2026-11-19T10:00:00Z"));
});

test("平均の差（前回比）", () => {
  assert.equal(formatDelta(12, 15, 21, 30), "−10.0"); // 80% → 70%
  assert.equal(formatDelta(21, 30, 36, 45), "+10.0"); // 70% → 80%
  assert.equal(formatDelta(36, 45, 48, 60), "±0.0");
  assert.equal(formatDelta(1, 3, 1, 2), "+16.7");
});

test("ニックネームの検証", () => {
  assert.deepEqual(validateNickname("  たろう  "), { ok: true, value: "たろう" });
  assert.equal(validateNickname("").ok, false);
  assert.equal(validateNickname("<script>").ok, false);
  assert.equal(validateNickname("あ".repeat(17)).ok, false);
  assert.equal(validateNickname("あ".repeat(16)).ok, true);
  assert.deepEqual(validateNickname("ＡＢＣ​"), { ok: true, value: "ABC" });
});

import { validateQuizSet } from "../src/lib/quiz-validate";
import sample from "../content/quiz-sets/sample-pharmacology-basics.v1.json";

test("問題データの検査：サンプルは合格・壊れたデータは不合格", () => {
  const ids = ["sample"];
  assert.deepEqual(validateQuizSet(sample, ids), []);
  const broken = structuredClone(sample) as any;
  broken.questions[0].answer = "z";             // 正答が選択肢にない
  broken.questions[2].prompt = "空欄なし";        // 穴埋めに [[blank]] がない
  broken.questions.pop();                         // 14問
  const errs = validateQuizSet(broken, ids);
  assert.ok(errs.some((e) => e.includes("answer が選択肢ID")));
  assert.ok(errs.some((e) => e.includes("[[blank]]")));
  assert.ok(errs.some((e) => e.includes("15問")));
});
