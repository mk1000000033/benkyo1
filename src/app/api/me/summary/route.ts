import { getAdmin } from "@/server/supabase-admin";
import { handle, json, requireUserId } from "@/server/http";
import { getInProgressAttempts } from "@/server/data";
import { getActiveSet } from "@/server/quiz-registry";
import { formatPercent } from "@/lib/ranking";
import type { MySummaryDTO } from "@/lib/api-types";

export const dynamic = "force-dynamic";

/** 自分の各セットの平均正答率・挑戦回数・進行中の挑戦 */
export const GET = handle(async (req: Request) => {
  const userId = await requireUserId(req);
  const { data, error } = await getAdmin()
    .from("leaderboard")
    .select("set_id, attempts_count, total_correct, total_questions")
    .eq("participant_id", userId);
  if (error) throw new Error(error.message);

  const summary: MySummaryDTO = { stats: {}, inProgress: {} };
  for (const r of data ?? []) {
    summary.stats[r.set_id as string] = {
      attemptsCount: r.attempts_count,
      totalCorrect: r.total_correct,
      totalQuestions: r.total_questions,
      percentText: formatPercent(r.total_correct, r.total_questions),
    };
  }
  for (const a of await getInProgressAttempts(userId)) {
    const active = getActiveSet(a.set_id);
    summary.inProgress[a.set_id] = {
      attemptId: a.id,
      version: a.set_version,
      answeredCount: a.answers.length,
      questionCount: a.question_count,
      outdated: !active || active.version !== a.set_version,
    };
  }
  return json(summary);
});
