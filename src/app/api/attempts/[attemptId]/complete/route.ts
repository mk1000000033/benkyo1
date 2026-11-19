import { handle, json, requireUserId } from "@/server/http";
import { getOwnAttempt, rpc } from "@/server/data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ attemptId: string }> };

/** 挑戦の完了とランキング更新（DB関数内で原子的・冪等に実行） */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId(req);
  const { attemptId } = await ctx.params;
  await getOwnAttempt(attemptId, userId); // 本人の挑戦か確認
  const result = await rpc<{ alreadyCompleted: boolean; attemptId: string }>("complete_attempt", {
    p_attempt: attemptId,
    p_participant: userId,
  });
  return json(result);
});
