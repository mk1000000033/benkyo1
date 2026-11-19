// API の応答の型（ブラウザ・サーバー共通）
import type { AnswerValue, PublicQuestion, QuestionType, QuizOption, RevealedInfo } from "./quiz-types";

export interface ParticipantDTO {
  id: string;
  nickname: string;
}

export interface MyStatDTO {
  attemptsCount: number;
  totalCorrect: number;
  totalQuestions: number;
  percentText: string;
}

export interface InProgressDTO {
  attemptId: string;
  version: number;
  answeredCount: number;
  questionCount: number;
  /** 問題が新バージョンに更新され、この挑戦は再開できない */
  outdated: boolean;
}

export interface MySummaryDTO {
  stats: Record<string, MyStatDTO>;
  inProgress: Record<string, InProgressDTO>;
}

export interface AttemptStateDTO {
  attemptId: string;
  setId: string;
  version: number;
  questionCount: number;
  currentIndex: number;
  correctCount: number;
  questions: PublicQuestion[];
  /** 回答済みの問題だけ、正答と解説を含む */
  revealed: Record<number, RevealedInfo>;
}

export interface AnswerResultDTO extends RevealedInfo {
  index: number;
  correctCount: number;
  answeredCount: number;
}

export interface ReviewItemDTO {
  index: number;
  type: QuestionType;
  prompt: string;
  options: QuizOption[] | null;
  answer: AnswerValue;
  correctAnswer: AnswerValue;
  isCorrect: boolean;
  explanation: string;
  sourcePage: string | null;
}

export interface ResultDTO {
  attemptId: string;
  setId: string;
  title: string;
  version: number;
  score: number;
  questionCount: number;
  thisPercentText: string;
  average: { percentText: string; attemptsCount: number };
  previous: { percentText: string; attemptsCount: number } | null;
  deltaText: string | null;
  direction: "first" | "up" | "down" | "same";
  rank: { rank: number; total: number } | null;
  completedAt: string;
  review: ReviewItemDTO[];
}

export interface RankingEntryDTO {
  rank: number;
  nickname: string;
  percentText: string;
  attemptsCount: number;
  isMe: boolean;
}

export interface RankingDTO {
  setId: string;
  title: string;
  entries: RankingEntryDTO[];
  me: RankingEntryDTO | null;
  fetchedAt: string;
}
