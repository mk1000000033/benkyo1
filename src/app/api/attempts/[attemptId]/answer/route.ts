import { HttpError, handle, json, readJson, requireUserId } from "@/server/http";
import { getOwnAttempt, rpc, type AttemptRow } from "@/server/data";
import { getSetVersion, gradeAnswer } from "@/server/quiz-registry";
import type { AnswerResultDTO } from "@/lib/api-types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ attemptId: string }> };

/** 1問の回答を確定し、採点結果と解説を返す（採点はサーバー側のみ） */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId(req);
  const { attemptId } = await ctx.params;
  const body = await readJson(req);
  const index = body.index;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
    throw new HttpError(400, "bad_index", "問題番号が正しくありません");
  }

  const attempt = await getOwnAttempt(attemptId, userId);
  const set = getSetVersion(attempt.set_id, attempt.set_version);
  if (!set) throw new HttpError(409, "set_version_missing", "問題が更新されました。最初からやり直してください");
  const q = set.questions[index];
  if (!q) throw new HttpError(400, "bad_index", "問題番号が正しくありません");

  // 既に回答済みなら（二重送信）、保存済みの結果をそのまま返す
  let row: AttemptRow = attempt;
  if (index >= attempt.answers.length) {
    const graded = gradeAnswer(q, body.answer);
    if (!graded) throw new HttpError(400, "bad_answer", "回答の形式が正しくありません");
    row = await rpc<AttemptRow>("record_answer", {
      p_attempt: attempt.id,
      p_participant: userId,
      p_index: index,
      p_question_id: q.id,
      p_type: q.type,
      p_answer: graded.answer,
      p_correct_answer: graded.correctAnswer,
      p_is_correct: graded.isCorrect,
    });
  }
  const stored = row.answers.find((a) => a.index === index);
  if (!stored) throw new HttpError(409, "out_of_order", "回答の順番が正しくありません。画面を再読み込みしてください");

  const result: AnswerResultDTO = {
    index,
    answer: stored.answer,
    correctAnswer: stored.correctAnswer,
    isCorrect: stored.isCorrect,
    explanation: q.explanation,
    sourcePage: q.sourcePage ?? null,
    correctCount: row.correct_count,
    answeredCount: row.answers.length,
  };
  return json(result);
});
