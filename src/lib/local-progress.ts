"use client";
// クイズの進行状態を端末にも保存（Safari を閉じても続きを表示できるように）
//   ※ 正しい状態はサーバー側にあり、再開時はサーバーの内容を優先して照合します。
import type { RevealedInfo } from "./quiz-types";

export interface LocalProgress {
  setId: string;
  version: number;
  attemptId: string;
  currentIndex: number;
  correctCount: number;
  revealed: Record<number, RevealedInfo>;
  /** 現在の問題の解説を表示中か */
  showingExplanation: boolean;
  savedAt: string;
}

const key = (setId: string) => `yq:progress:${setId}`;

export function saveLocalProgress(p: LocalProgress): void {
  try {
    localStorage.setItem(key(p.setId), JSON.stringify(p));
  } catch {
    /* プライベートモード等で保存できなくても動作は継続 */
  }
}

export function loadLocalProgress(setId: string): LocalProgress | null {
  try {
    const raw = localStorage.getItem(key(setId));
    return raw ? (JSON.parse(raw) as LocalProgress) : null;
  } catch {
    return null;
  }
}

export function clearLocalProgress(setId: string): void {
  try {
    localStorage.removeItem(key(setId));
  } catch {
    /* noop */
  }
}
