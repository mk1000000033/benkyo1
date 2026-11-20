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
  /** テーマ（content/themes.ts の id）。問題の分類用 */
  tags?: string[];
  /** 問題に添える画像（構造式など）。src は public/ からのパス（例: "/structures/2025/q7-a.png"） */
  image?: QuestionImage | null;
}

export interface QuestionImage {
  src: string;
  /** 画像の説明（読み上げ用）。答えになる名前は書かない */
  alt: string;
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
  /** 空欄が1つのときの選択肢。空欄が複数（blanks あり）のときは、全空欄の選択肢をつなげたもの */
  options: QuizOption[];
  /** 空欄が1つのときは選択肢ID。複数のときは各空欄の正解IDを "|" でつないだもの（例: "1b|2a|3c"） */
  answer: string;
  /** 空欄が2つ以上のとき：空欄ごとの選択肢と正解（prompt の [[blank]] と同じ順番・同じ数） */
  blanks?: FillBlank[] | null;
}

export interface FillBlank {
  options: QuizOption[];
  answer: string;
}

/** 複数空欄の回答をつなぐ記号 */
export const BLANK_JOIN = "|";

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
  /** true のとき、問題形式が1種類だけでもよい（構造式クイズなど） */
  singleTypeOk?: boolean;
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

/** 「わからない」で答えを見たときの回答（不正解として記録） */
export const SKIP_ANSWER = "__skip__";
