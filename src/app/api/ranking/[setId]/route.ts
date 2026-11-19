import { HttpError, handle, json, requireUserId } from "@/server/http";
import { getRanking } from "@/server/data";
import { getActiveSet } from "@/server/quiz-registry";
import type { RankingDTO } from "@/lib/api-types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ setId: string }> };

/** 問題セットごとのランキング（全員で共有） */
export const GET = handle(async (req: Request, ctx: Ctx) => {
  const userId = await requireUserId(req);
  const { setId } = await ctx.params;
  const set = getActiveSet(setId);
  if (!set) throw new HttpError(404, "set_not_found", "問題セットが見つかりません");
  const { entries, me } = await getRanking(set.id, userId);
  const dto: RankingDTO = { setId: set.id, title: set.title, entries, me, fetchedAt: new Date().toISOString() };
  return json(dto);
});
