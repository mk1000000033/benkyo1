import { BLANK_JOIN, type AnswerValue, type Question } from "./quiz-types";

/** 採点。回答の形式が不正なら null */
export function gradeAnswer(q: Question, answer: AnswerValue): boolean | null {
  if (q.type === "truefalse") return typeof answer === "boolean" ? answer === q.answer : null;
  if (q.type === "fill" && q.blanks && q.blanks.length > 1) {
    if (typeof answer !== "string") return null;
    const parts = answer.split(BLANK_JOIN);
    if (parts.length !== q.blanks.length) return null;
    if (!parts.every((id, i) => q.blanks![i].options.some((o) => o.id === id))) return null;
    return answer === q.answer;
  }
  if (typeof answer !== "string" || !q.options.some((o) => o.id === answer)) return null;
  return answer === q.answer;
}
