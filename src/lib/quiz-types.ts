// 問題データの型定義

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
  /** テーマ（content/themes.ts の id）。テーマ別ミックスで使う */
  tags?: string[];
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
  /** フォルダ名（例: "2024年度 中間試験"）。同じ名前のセットが1つのフォルダにまとまる */
  group?: string | null;
  published: boolean;
  isSample?: boolean;
  sourceMaterial?: string;
  questions: Question[];
}

/** 一覧表示用のメタ情報 */
export interface QuizSetSummary {
  id: string;
  version: number;
  subjectId: string;
  title: string;
  lectureDate: string | null;
  group: string | null;
  questionCount: number;
  isSample: boolean;
  /** まとめ（学習ノート）があるか */
  hasNote: boolean;
}

export const BLANK_TOKEN = "[[blank]]";
