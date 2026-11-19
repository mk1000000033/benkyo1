"use client";
// ブラウザ用 Supabase クライアント（匿名認証のセッションを端末に保存）
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません");
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "yq-auth", detectSessionInUrl: false },
  });
  return client;
}

let signingIn: Promise<string> | null = null;

/** 有効なアクセストークンを返す（なければ匿名ログインする。同時に呼ばれても1回だけ） */
export async function getAccessToken(): Promise<string> {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.access_token;
  if (!signingIn) {
    signingIn = (async () => {
      const { data: signed, error } = await sb.auth.signInAnonymously();
      if (error || !signed.session) throw new Error("匿名ログインに失敗しました。Supabase の匿名認証が有効か確認してください");
      return signed.session.access_token;
    })().finally(() => {
      signingIn = null;
    });
  }
  return signingIn;
}

/** この端末の参加者ID（匿名ユーザーID） */
export async function getUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user.id ?? null;
}
