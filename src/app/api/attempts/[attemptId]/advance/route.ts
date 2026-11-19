import { HttpError, handle, json, readJson, requireUserId } from "@/server/http";
import { rpc, type AttemptRow } from "@/server/data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ attemptId: string }> };

/** 「次の問題へ」— 現在の問題番号をサーバーにも保存（途中再開用） */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId(req);
  const { attemptId } = await ctx.params;
  const body = await readJson(req);
  const toIndex = body.toIndex;
  if (typeof toIndex !== "number" || !Number.isInteger(toIndex) || toIndex < 1) {
    throw new HttpError(400, "bad_index", "問題番号が正しくありません");
  }
  const row = await rpc<AttemptRow>("advance_attempt", {
    p_attempt: attemptId,
    p_participant: userId,
    p_to_index: toIndex,
  });
  return json({ currentIndex: row.current_index });
});
