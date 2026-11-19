"use client";
// 共有（LINE・共有シート・コピー）

/** LINE の共有画面を開く URL（スマホでは LINE アプリが開く） */
export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}

export function siteUrl(): string {
  try {
    return window.location.origin;
  } catch {
    return "";
  }
}

export function canShareText(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** 共有シートで送る。キャンセルされたら false */
export async function shareVia(data: ShareData): Promise<boolean> {
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
