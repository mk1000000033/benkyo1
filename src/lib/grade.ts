import type { AnswerValue, Question } from "./quiz-types";

/** 採点。回答の形式が不正なら null */
export function gradeAnswer(q: Question, answer: AnswerValue): boolean | null {
  if (q.type === "truefalse") return typeof answer === "boolean" ? answer === q.answer : null;
  if (typeof answer !== "string" || !q.options.some((o) => o.id === answer)) return null;
  return answer === q.answer;
}
