"use client";
import { getAccessToken } from "./supabase-browser";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** サーバーAPIを呼ぶ（匿名認証のトークンを自動で付ける） */
export async function api<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const token = await getAccessToken();
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network", "通信できませんでした。電波の良いところで再度お試しください");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? "エラーが発生しました");
  return data as T;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "エラーが発生しました";
}
