// 問題セットJSONの形式チェック（ビルド時スクリプトとサーバー起動時の両方で使う）
import { BLANK_TOKEN, type Question, type QuizSetFile } from "./quiz-types";

/** 1セットの問題数（内容に合わせてこの範囲で決める） */
export const MIN_QUESTIONS = 10;
export const MAX_QUESTIONS = 20;
const ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function checkOptions(q: Record<string, unknown>, where: string, errors: string[], exact?: number) {
  const opts = q.options;
  if (!Array.isArray(opts)) {
    errors.push(`${where}: options が配列ではありません`);
    return [] as string[];
  }
  if (exact !== undefined && opts.length !== exact) errors.push(`${where}: 選択肢は${exact}個にしてください（現在${opts.length}個）`);
  if (exact === undefined && (opts.length < 3 || opts.length > 6)) errors.push(`${where}: 選択肢は3〜6個にしてください`);
  const ids: string[] = [];
  const texts = new Set<string>();
  for (const o of opts) {
    if (!o || !isNonEmptyString((o as { id?: unknown }).id) || !isNonEmptyString((o as { text?: unknown }).text)) {
      errors.push(`${where}: 選択肢に id / text がありません`);
      continue;
    }
    const { id, text } = o as { id: string; text: string };
    if (ids.includes(id)) errors.push(`${where}: 選択肢IDが重複しています (${id})`);
    if (texts.has(text.trim())) errors.push(`${where}: 同じ文言の選択肢があります (${text})`);
    ids.push(id);
    texts.add(text.trim());
  }
  return ids;
}

/** 1つの問題セットを検査し、エラーメッセージの配列を返す（空なら合格） */
export function validateQuizSet(data: unknown, knownSubjectIds: string[]): string[] {
  const errors: string[] = [];
  if (!data || typeof data !== "object") return ["JSONがオブジェクトではありません"];
  const s = data as Record<string, unknown>;
  const label = typeof s.id === "string" ? `${s.id}@v${String(s.version)}` : "(id不明)";

  if (typeof s.id !== "string" || !ID_RE.test(s.id)) errors.push(`${label}: id は半角英小文字・数字・ハイフン（3〜64文字）にしてください`);
  if (!Number.isInteger(s.version) || (s.version as number) < 1) errors.push(`${label}: version は1以上の整数にしてください`);
  if (typeof s.subjectId !== "string" || !knownSubjectIds.includes(s.subjectId)) errors.push(`${label}: subjectId "${String(s.subjectId)}" が content/subjects.ts にありません`);
  if (!isNonEmptyString(s.title)) errors.push(`${label}: title がありません`);
  if (s.lectureDate != null && (typeof s.lectureDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.lectureDate))) errors.push(`${label}: lectureDate は "YYYY-MM-DD" 形式か null にしてください`);
  if (typeof s.published !== "boolean") errors.push(`${label}: published は true / false にしてください`);

  const qs = s.questions;
  if (!Array.isArray(qs)) return [...errors, `${label}: questions が配列ではありません`];
  if (qs.length < MIN_QUESTIONS || qs.length > MAX_QUESTIONS) {
    errors.push(`${label}: 問題数は${MIN_QUESTIONS}〜${MAX_QUESTIONS}問にしてください（現在${qs.length}問）`);
  }

  const qIds = new Set<string>();
  const types = new Set<string>();
  qs.forEach((raw, i) => {
    const where = `${label} 第${i + 1}問`;
    if (!raw || typeof raw !== "object") return void errors.push(`${where}: オブジェクトではありません`);
    const q = raw as Record<string, unknown>;
    if (!isNonEmptyString(q.id)) errors.push(`${where}: id がありません`);
    else if (qIds.has(q.id)) errors.push(`${where}: 問題IDが重複しています (${q.id})`);
    else qIds.add(q.id);
    if (!isNonEmptyString(q.prompt)) errors.push(`${where}: prompt（問題文）がありません`);
    if (!isNonEmptyString(q.explanation)) errors.push(`${where}: explanation（解説）がありません`);
    if (q.sourcePage != null && typeof q.sourcePage !== "string") errors.push(`${where}: sourcePage は文字列か null にしてください`);
    types.add(String(q.type));

    switch (q.type) {
      case "choice": {
        const ids = checkOptions(q, where, errors, 4);
        if (typeof q.answer !== "string" || !ids.includes(q.answer)) errors.push(`${where}: answer が選択肢IDのどれとも一致しません`);
        break;
      }
      case "fill": {
        const ids = checkOptions(q, where, errors);
        if (typeof q.answer !== "string" || !ids.includes(q.answer)) errors.push(`${where}: answer が選択肢IDのどれとも一致しません`);
        const count = typeof q.prompt === "string" ? q.prompt.split(BLANK_TOKEN).length - 1 : 0;
        if (count !== 1) errors.push(`${where}: 穴埋め問題の prompt には ${BLANK_TOKEN} をちょうど1つ入れてください（現在${count}個）`);
        break;
      }
      case "truefalse":
        if (typeof q.answer !== "boolean") errors.push(`${where}: ○×問題の answer は true（○）か false（×）にしてください`);
        if ("options" in q) errors.push(`${where}: ○×問題に options は不要です`);
        break;
      default:
        errors.push(`${where}: type は "choice" / "truefalse" / "fill" のいずれかにしてください`);
    }
  });

  for (const t of ["choice", "truefalse", "fill"]) {
    if (!types.has(t)) errors.push(`${label}: 3種類の問題形式を混ぜてください（"${t}" が0問です）`);
  }
  return errors;
}

/** 型を確定させる（検査に合格したデータにのみ使う） */
export function asQuizSet(data: unknown): QuizSetFile {
  return data as QuizSetFile;
}

export function isQuestion(q: unknown): q is Question {
  return !!q && typeof q === "object" && "type" in q;
}
