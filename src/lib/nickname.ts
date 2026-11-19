// ニックネームの正規化と検証（ブラウザとサーバーの両方で同じルールを使う）
//   ・表示は React が自動でエスケープするため XSS は起きませんが、念のため
//     制御文字・見えない文字・山かっこを拒否し、長さも制限します。

export const NICKNAME_MAX = 16;
export const NICKNAME_STORAGE_KEY = "yq:nickname";

// 制御文字・ゼロ幅文字・双方向制御文字など
// eslint-disable-next-line no-control-regex
const INVISIBLE_RE = /[\u0000-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁩﻿]/g;

export function normalizeNickname(raw: string): string {
  return raw.normalize("NFKC").replace(INVISIBLE_RE, "").replace(/\s+/g, " ").trim();
}

export type NicknameResult = { ok: true; value: string } | { ok: false; error: string };

export function validateNickname(raw: unknown): NicknameResult {
  if (typeof raw !== "string") return { ok: false, error: "ニックネームを入力してください" };
  const value = normalizeNickname(raw);
  const length = Array.from(value).length;
  if (length === 0) return { ok: false, error: "ニックネームを入力してください" };
  if (length > NICKNAME_MAX) return { ok: false, error: `ニックネームは${NICKNAME_MAX}文字以内にしてください` };
  if (/[<>]/.test(value)) return { ok: false, error: "「<」「>」は使えません" };
  return { ok: true, value };
}

export function nicknameLength(raw: string): number {
  return Array.from(normalizeNickname(raw)).length;
}
