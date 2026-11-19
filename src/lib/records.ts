// 学習記録（この端末のブラウザに保存）
//   ・挑戦の完了ごとに累計正解数・累計出題数・挑戦回数を積み上げる（低い点も削除しない）
//   ・同じ挑戦を2回完了させても1回分しか数えない（冪等）
//   ・途中の挑戦は別に保存し、平均正答率には含めない
import type { AnswerValue } from "./quiz-types";

export interface StoredAnswer {
  index: number;
  answer: AnswerValue;
  isCorrect: boolean;
}

export interface Totals {
  attemptsCount: number;
  totalCorrect: number;
  totalQuestions: number;
}

export interface AttemptRecord {
  id: string;
  setId: string;
  version: number;
  questionCount: number;
  score: number;
  startedAt: string;
  completedAt: string;
  answers: StoredAnswer[];
  /** この挑戦を完了する直前の累計（結果画面の「前回との差」に使う） */
  prev: Totals;
}

export interface SetRecord extends Totals {
  /** 最後に挑戦を完了した日時（ISO文字列） */
  lastCompletedAt?: string;
  /** 復習用に直近の挑戦の詳細を保存（古いものから削除。累計値は削除しない） */
  attempts: AttemptRecord[];
}

export interface Progress {
  attemptId: string;
  setId: string;
  version: number;
  questionCount: number;
  /** 表示中の問題番号（0始まり） */
  currentIndex: number;
  /** 確定済みの回答（currentIndex の回答があれば解説を表示中） */
  answers: StoredAnswer[];
  startedAt: string;
}

export const MAX_STORED_ATTEMPTS = 30;
const EMPTY: SetRecord = { attemptsCount: 0, totalCorrect: 0, totalQuestions: 0, attempts: [] };

/** 完了した挑戦を記録に加える（純粋関数）。既に記録済みなら変更しない */
export function addCompletedAttempt(
  record: SetRecord | null,
  progress: Progress,
  completedAt: string,
): { record: SetRecord; attempt: AttemptRecord; added: boolean } {
  const base = record ?? EMPTY;
  const existing = base.attempts.find((a) => a.id === progress.attemptId);
  if (existing) return { record: base, attempt: existing, added: false };
  if (progress.answers.length < progress.questionCount) throw new Error("まだ全問回答していません");

  const answers = [...progress.answers].sort((a, b) => a.index - b.index);
  const score = answers.filter((a) => a.isCorrect).length;
  const attempt: AttemptRecord = {
    id: progress.attemptId,
    setId: progress.setId,
    version: progress.version,
    questionCount: progress.questionCount,
    score,
    startedAt: progress.startedAt,
    completedAt,
    answers,
    prev: { attemptsCount: base.attemptsCount, totalCorrect: base.totalCorrect, totalQuestions: base.totalQuestions },
  };
  return {
    added: true,
    attempt,
    record: {
      attemptsCount: base.attemptsCount + 1,
      totalCorrect: base.totalCorrect + score,
      totalQuestions: base.totalQuestions + progress.questionCount,
      lastCompletedAt: completedAt,
      attempts: [...base.attempts, attempt].slice(-MAX_STORED_ATTEMPTS),
    },
  };
}

/** 回答を進行状態に加える（純粋関数）。確定済みの問題・順番飛ばしは無視 */
export function addAnswer(p: Progress, a: StoredAnswer): Progress {
  if (a.index !== p.currentIndex || p.answers.some((x) => x.index === a.index)) return p;
  return { ...p, answers: [...p.answers, a] };
}

/** 最後に取り組んだ日時（古い形式の記録にも対応） */
export function lastCompletedAt(r: SetRecord | null): string | null {
  if (!r) return null;
  return r.lastCompletedAt ?? r.attempts[r.attempts.length - 1]?.completedAt ?? null;
}

// ---------------- ブラウザ保存（localStorage） ----------------

const recordKey = (setId: string) => `yq:v1:record:${setId}`;
const progressKey = (setId: string) => `yq:v1:progress:${setId}`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // プライベートモード・容量不足など
  }
}

export const loadRecord = (setId: string) => read<SetRecord>(recordKey(setId));
export const saveRecord = (setId: string, r: SetRecord) => write(recordKey(setId), r);
export const loadProgress = (setId: string) => read<Progress>(progressKey(setId));
export const saveProgress = (p: Progress) => write(progressKey(p.setId), p);
export function clearProgress(setId: string) {
  try {
    localStorage.removeItem(progressKey(setId));
  } catch {
    /* noop */
  }
}

// 保存できない環境でも直後の結果画面は表示できるよう、メモリにも持っておく
const recentAttempts = new Map<string, AttemptRecord>();

/** 挑戦を完了し、記録を保存する（二重に呼ばれても1回分だけ） */
export function completeAndSave(progress: Progress): AttemptRecord {
  const { record, attempt, added } = addCompletedAttempt(loadRecord(progress.setId), progress, new Date().toISOString());
  if (added) saveRecord(progress.setId, record);
  clearProgress(progress.setId);
  recentAttempts.set(attempt.id, attempt);
  return attempt;
}

/** 完了した挑戦を探す（結果画面用） */
export function findAttempt(setId: string, attemptId: string): AttemptRecord | null {
  return loadRecord(setId)?.attempts.find((a) => a.id === attemptId) ?? recentAttempts.get(attemptId) ?? null;
}

export function newAttemptId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** この端末の記録をすべて消す（設定などから使う場合用） */
export function clearAllRecords() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("yq:"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
