import { HttpError, handle, json, requireUserId } from "@/server/http";
import { getOwnAttempt, getRanking } from "@/server/data";
import { getSetVersion } from "@/server/quiz-registry";
import { compareRates, formatDelta, formatPercent } from "@/lib/ranking";
import type { ResultDTO, ReviewItemDTO } from "@/lib/api-types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ attemptId: string }> };

/** 完了した挑戦の結果と全問復習 */
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId(req);
  const { attemptId } = await ctx.params;
  const a = await getOwnAttempt(attemptId, userId);
  if (a.status !== "completed") throw new HttpError(409, "not_completed", "この挑戦はまだ完了していません");
  const set = getSetVersion(a.set_id, a.set_version);

  // この挑戦の完了直後の累計 = 直前の累計 + 今回
  const n0 = a.prev_attempts_count ?? 0;
  const c0 = a.prev_total_correct ?? 0;
  const q0 = a.prev_total_questions ?? 0;
  const n1 = n0 + 1;
  const c1 = c0 + a.correct_count;
  const q1 = q0 + a.question_count;

  let direction: ResultDTO["direction"] = "first";
  if (n0 > 0) {
    const cmp = compareRates(c1, q1, c0, q0);
    direction = cmp > 0 ? "up" : cmp < 0 ? "down" : "same";
  }

  const ranking = await getRanking(a.set_id, userId);

  const review: ReviewItemDTO[] = a.answers
    .slice()
    .sort((x, y) => x.index - y.index)
    .map((ans) => {
      const q = set?.questions[ans.index];
      return {
        index: ans.index,
        type: (q?.type ?? ans.type) as ReviewItemDTO["type"],
        prompt: q?.prompt ?? "（この問題のデータは見つかりませんでした）",
        options: q && q.type !== "truefalse" ? q.options : null,
        answer: ans.answer,
        correctAnswer: ans.correctAnswer,
        isCorrect: ans.isCorrect,
        explanation: q?.explanation ?? "",
        sourcePage: q?.sourcePage ?? null,
      };
    });

  const result: ResultDTO = {
    attemptId: a.id,
    setId: a.set_id,
    title: set?.title ?? a.set_id,
    version: a.set_version,
    score: a.correct_count,
    questionCount: a.question_count,
    thisPercentText: formatPercent(a.correct_count, a.question_count),
    average: { percentText: formatPercent(c1, q1), attemptsCount: n1 },
    previous: n0 > 0 ? { percentText: formatPercent(c0, q0), attemptsCount: n0 } : null,
    deltaText: n0 > 0 ? formatDelta(c0, q0, c1, q1) : null,
    direction,
    rank: ranking.me ? { rank: ranking.me.rank, total: ranking.entries.length } : null,
    completedAt: a.completed_at ?? "",
    review,
  };
  return json(result);
});
