// 暗記カードの形
import { BLANK_TOKEN, type Question } from "./quiz-types";

export interface FlashCard {
  id: string;
  kind: "keyword" | "choice" | "truefalse" | "fill";
  /** おもて（問い） */
  front: string;
  /** うら（答え） */
  back: string;
  /** うらに添える解説 */
  detail: string | null;
  /** どのセットのカードか */
  source: string;
}

/** 問題を、選択肢なしで思い出すカードにする */
export function questionToCard(id: string, q: Question, source: string): FlashCard {
  if (q.type === "truefalse") {
    return { id, kind: "truefalse", front: q.prompt, back: q.answer ? "○（正しい）" : "×（誤り）", detail: q.explanation, source };
  }
  const answer = q.options.find((o) => o.id === q.answer)?.text ?? "";
  return { id, kind: q.type, front: q.prompt.split(BLANK_TOKEN).join("（　　）"), back: answer, detail: q.explanation, source };
}
