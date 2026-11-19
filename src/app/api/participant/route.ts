import { getAdmin } from "@/server/supabase-admin";
import { HttpError, handle, json, readJson, requireUserId } from "@/server/http";
import { validateNickname } from "@/lib/nickname";
import type { ParticipantDTO } from "@/lib/api-types";

export const dynamic = "force-dynamic";

/** 自分の参加者情報 */
export const GET = handle(async (req: Request) => {
  const userId = await requireUserId(req);
  const { data, error } = await getAdmin().from("participants").select("id, nickname").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return json({ participant: (data as ParticipantDTO | null) ?? null });
});

/** ニックネームの登録・変更 */
export const POST = handle(async (req: Request) => {
  const userId = await requireUserId(req);
  const body = await readJson(req);
  const result = validateNickname(body.nickname);
  if (!result.ok) throw new HttpError(400, "invalid_nickname", result.error);
  const { data, error } = await getAdmin()
    .from("participants")
    .upsert({ id: userId, nickname: result.value, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("id, nickname")
    .single();
  if (error) throw new Error(error.message);
  return json({ participant: data as ParticipantDTO });
});
