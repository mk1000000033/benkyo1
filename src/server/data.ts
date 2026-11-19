// データベース操作（サーバー専用）
import "server-only";
import { findSubject } from "@content/subjects";
import type { AnswerValue, QuizSetFile, RevealedInfo } from "@/lib/quiz-types";
import { formatPercent, rankRows, type RankRow } from "@/lib/ranking";
import type { RankingEntryDTO } from "@/lib/api-types";
import { getAdmin } from "./supabase-admin";
import { HttpError } from "./http";
import { getSetVersion } from "./quiz-registry";

export interface StoredAnswer {
  index: number;
  questionId: string;
  type: string;
  answer: AnswerValue;
  correctAnswer: AnswerValue;
  isCorrect: boolean;
  answeredAt: string;
}

export interface AttemptRow {
  id: string;
  participant_id: string;
  set_id: string;
  set_version: number;
  question_count: number;
  status: "in_progress" | "completed" | "abandoned";
  answers: StoredAnswer[];
  current_index: number;
  correct_count: number;
  started_at: string;
  completed_at: string | null;
  prev_attempts_count: number | null;
  prev_total_correct: number | null;
  prev_total_questions: number | null;
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** RPC を呼び、結果の1行を返す */
export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getAdmin().rpc(name, args);
  fail(error);
  return (Array.isArray(data) ? data[0] : data) as T;
}

/** 問題セットのメタ情報を DB に登録（未登録なら追加・公開状態などを更新） */
export async function ensureQuizSetRow(set: QuizSetFile): Promise<void> {
  const subject = findSubject(set.subjectId);
  const { error } = await getAdmin()
    .from("quiz_sets")
    .upsert(
      {
        set_id: set.id,
        version: set.version,
        subject_id: set.subjectId,
        subject_name: subject?.name ?? set.subjectId,
        title: set.title,
        question_count: set.questions.length,
        is_published: set.published,
        is_sample: !!set.isSample,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "set_id,version" },
    );
  fail(error);
}

export async function getOwnAttempt(attemptId: string, userId: string): Promise<AttemptRow> {
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) throw new HttpError(404, "attempt_not_found", "挑戦が見つかりません");
  const { data, error } = await getAdmin()
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("participant_id", userId)
    .maybeSingle();
  fail(error);
  if (!data) throw new HttpError(404, "attempt_not_found", "挑戦が見つかりません");
  return data as AttemptRow;
}

export async function getInProgressAttempts(userId: string, setId?: string): Promise<AttemptRow[]> {
  let q = getAdmin().from("attempts").select("*").eq("participant_id", userId).eq("status", "in_progress");
  if (setId) q = q.eq("set_id", setId);
  const { data, error } = await q;
  fail(error);
  return (data ?? []) as AttemptRow[];
}

/** 回答済みの問題の正答・解説（回答前の問題は含めない） */
export function revealedFor(attempt: AttemptRow): Record<number, RevealedInfo> {
  const set = getSetVersion(attempt.set_id, attempt.set_version);
  const out: Record<number, RevealedInfo> = {};
  for (const a of attempt.answers) {
    const q = set?.questions[a.index];
    out[a.index] = {
      answer: a.answer,
      correctAnswer: a.correctAnswer,
      isCorrect: a.isCorrect,
      explanation: q?.explanation ?? "",
      sourcePage: q?.sourcePage ?? null,
    };
  }
  return out;
}

export interface LeaderboardRow {
  participant_id: string;
  set_id: string;
  attempts_count: number;
  total_correct: number;
  total_questions: number;
  reached_at: string;
  participants: { nickname: string } | { nickname: string }[] | null;
}

function nicknameOf(p: LeaderboardRow["participants"]): string {
  if (!p) return "（名前なし）";
  return Array.isArray(p) ? (p[0]?.nickname ?? "（名前なし）") : p.nickname;
}

/** 問題セットのランキング（厳密な分数比較で並べ替え） */
export async function getRanking(setId: string, userId: string | null) {
  const { data, error } = await getAdmin()
    .from("leaderboard")
    .select("participant_id, set_id, attempts_count, total_correct, total_questions, reached_at, participants(nickname)")
    .eq("set_id", setId);
  fail(error);
  const rows: RankRow[] = ((data ?? []) as LeaderboardRow[]).map((r) => ({
    participantId: r.participant_id,
    nickname: nicknameOf(r.participants),
    attemptsCount: r.attempts_count,
    totalCorrect: r.total_correct,
    totalQuestions: r.total_questions,
    reachedAt: r.reached_at,
  }));
  const ranked = rankRows(rows);
  const entries: RankingEntryDTO[] = ranked.map((r) => ({
    rank: r.rank,
    nickname: r.nickname,
    percentText: formatPercent(r.totalCorrect, r.totalQuestions),
    attemptsCount: r.attemptsCount,
    isMe: r.participantId === userId,
  }));
  return { entries, me: entries.find((e) => e.isMe) ?? null };
}
