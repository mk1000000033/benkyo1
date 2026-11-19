import "server-only";
import { NextResponse } from "next/server";
import { getAdmin } from "./supabase-admin";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

const DB_ERRORS: Record<string, [number, string]> = {
  attempt_not_found: [404, "挑戦が見つかりません"],
  attempt_not_active: [409, "この挑戦はすでに終了しています"],
  out_of_order: [409, "回答の順番が正しくありません。画面を再読み込みしてください"],
  index_out_of_range: [400, "問題番号が正しくありません"],
  cannot_advance: [409, "まだ次の問題に進めません"],
  not_finished: [409, "まだ全問回答していません"],
};

/** Route Handler をラップして、エラーを JSON で返す */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status);
      const msg = e instanceof Error ? e.message : String(e);
      const mapped = Object.entries(DB_ERRORS).find(([k]) => msg.includes(k));
      if (mapped) return json({ error: mapped[0], message: mapped[1][1] }, mapped[1][0]);
      console.error(e);
      return json({ error: "server_error", message: "サーバーでエラーが発生しました。少し待ってから再度お試しください" }, 500);
    }
  };
}

/** Authorization: Bearer <アクセストークン> を検証し、参加者ID（匿名ユーザーID）を返す */
export async function requireUserId(req: Request): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthorized", "ログイン情報がありません。ページを再読み込みしてください");
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "unauthorized", "ログイン情報の有効期限が切れました。ページを再読み込みしてください");
  return data.user.id;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    throw new HttpError(400, "bad_request", "リクエストの形式が正しくありません");
  }
}
