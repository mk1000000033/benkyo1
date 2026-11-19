import { HttpError, handle, json, readJson, requireUserId } from "@/server/http";
import { ensureQuizSetRow, getInProgressAttempts, revealedFor, rpc, type AttemptRow } from "@/server/data";
import { getActiveSet, toPublicQuestion } from "@/server/quiz-registry";
import type { AttemptStateDTO, InProgressDTO } from "@/lib/api-types";

export const dynamic = "force-dynamic";

/** 進行中の挑戦があるか確認  GET /api/attempts?setId=xxx */
export const GET = handle(async (req: Request) => {
  const userId = await requireUserId(req);
  const setId = new URL(req.url).searchParams.get("setId") ?? "";
  const active = getActiveSet(setId);
  if (!active) throw new HttpError(404, "set_not_found", "問題セットが見つかりません");
  const [a] = await getInProgressAttempts(userId, setId);
  const inProgress: InProgressDTO | null = a
    ? {
        attemptId: a.id,
        version: a.set_version,
        answeredCount: a.answers.length,
        questionCount: a.question_count,
        outdated: a.set_version !== active.version,
      }
    : null;
  return json({ inProgress });
});

/** 挑戦を開始（mode: "resume" = 続きから / "new" = 最初から） */
export const POST = handle(async (req: Request) => {
  const userId = await requireUserId(req);
  const body = await readJson(req);
  const setId = typeof body.setId === "string" ? body.setId : "";
  const mode = body.mode === "resume" ? "resume" : "new";
  const set = getActiveSet(setId);
  if (!set) throw new HttpError(404, "set_not_found", "問題セットが見つかりません");

  await ensureQuizSetRow(set);
  const attempt = await rpc<AttemptRow>("start_attempt", {
    p_participant: userId,
    p_set_id: set.id,
    p_version: set.version,
    p_question_count: set.questions.length,
    p_mode: mode,
  });

  const state: AttemptStateDTO = {
    attemptId: attempt.id,
    setId: set.id,
    version: set.version,
    questionCount: attempt.question_count,
    currentIndex: attempt.current_index,
    correctCount: attempt.correct_count,
    questions: set.questions.map(toPublicQuestion),
    revealed: revealedFor(attempt),
  };
  return json(state);
});
