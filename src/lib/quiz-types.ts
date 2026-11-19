// 問題データの型定義（クライアントとサーバーで共有。正答そのものはここには含まれない）

export type QuestionType = "choice" | "truefalse" | "fill";
export type AnswerValue = string | boolean;

export interface QuizOption {
  id: string;
  text: string;
}

interface QuestionBase {
  /** セット内で一意なID（例: "q01"） */
  id: string;
  /** 問題文。穴埋め問題は空欄の位置に [[blank]] を1つだけ書く */
  prompt: string;
  /** 解説（必須） */
  explanation: string;
  /** 根拠となる授業資料のページ（例: "p.12", "スライド8"）。不明なら null */
  sourcePage?: string | null;
}

/** 4択問題 */
export interface ChoiceQuestion extends QuestionBase {
  type: "choice";
  options: QuizOption[];
  answer: string;
}

/** ○×問題（answer: true = ○ / false = ×） */
export interface TrueFalseQuestion extends QuestionBase {
  type: "truefalse";
  answer: boolean;
}

/** 穴埋め問題（空欄をタップして選択肢から選ぶ） */
export interface FillQuestion extends QuestionBase {
  type: "fill";
  options: QuizOption[];
  answer: string;
}

export type Question = ChoiceQuestion | TrueFalseQuestion | FillQuestion;

/** content/quiz-sets/*.json の形式 */
export interface QuizSetFile {
  id: string;
  version: number;
  subjectId: string;
  title: string;
  lectureDate?: string | null;
  published: boolean;
  isSample?: boolean;
  sourceMaterial?: string;
  questions: Question[];
}

/** クライアントに送ってよい問題（正答・解説を除いたもの） */
export type PublicQuestion =
  | Omit<ChoiceQuestion, "answer" | "explanation" | "sourcePage">
  | Omit<TrueFalseQuestion, "answer" | "explanation" | "sourcePage">
  | Omit<FillQuestion, "answer" | "explanation" | "sourcePage">;

/** 回答確定後にだけ送る情報 */
export interface RevealedInfo {
  answer: AnswerValue;
  correctAnswer: AnswerValue;
  isCorrect: boolean;
  explanation: string;
  sourcePage: string | null;
}

/** 一覧表示用のメタ情報（秘密情報なし） */
export interface QuizSetSummary {
  id: string;
  version: number;
  subjectId: string;
  title: string;
  lectureDate: string | null;
  questionCount: number;
  isSample: boolean;
}

export const BLANK_TOKEN = "[[blank]]";
