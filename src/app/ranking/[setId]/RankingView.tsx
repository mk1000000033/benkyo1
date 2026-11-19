"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RankingDTO, RankingEntryDTO } from "@/lib/api-types";
import { api, errorMessage } from "@/lib/api-client";
import { ErrorBox, LoadingScreen } from "@/components/ui";

const REFRESH_MS = 20_000;

const PODIUM = [
  // 表示順：2位・1位・3位
  { rank: 2, medal: "🥈", height: "h-24", bg: "bg-candy-sky", soft: "bg-candy-sky-soft" },
  { rank: 1, medal: "🥇", height: "h-32", bg: "bg-candy-yellow", soft: "bg-candy-yellow-soft" },
  { rank: 3, medal: "🥉", height: "h-16", bg: "bg-candy-pink", soft: "bg-candy-pink-soft" },
];

function PodiumSlot({ entry, cfg }: { entry: RankingEntryDTO | undefined; cfg: (typeof PODIUM)[number] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      {entry ? (
        <div className={`mb-2 w-full rounded-2xl ${cfg.soft} px-1 py-2 text-center ${entry.isMe ? "ring-4 ring-candy-purple" : ""}`}>
          <div className={`text-3xl ${cfg.rank === 1 ? "animate-bounce" : ""}`} aria-hidden>
            {cfg.rank === 1 ? "👑" : cfg.medal}
          </div>
          <p className="truncate px-1 text-sm font-extrabold" title={entry.nickname}>
            {entry.nickname}
          </p>
          <p className="text-lg font-extrabold">{entry.percentText}%</p>
          <p className="text-[11px] font-bold text-ink-soft">{entry.attemptsCount}回</p>
        </div>
      ) : (
        <div className="mb-2 py-6 text-center text-xs font-bold text-ink-soft">だれかな？</div>
      )}
      <div className={`flex w-full ${cfg.height} items-start justify-center rounded-t-2xl ${cfg.bg} pt-2 text-2xl font-extrabold text-white shadow-[inset_0_-6px_0_rgba(0,0,0,0.08)]`}>
        {cfg.rank}
      </div>
    </div>
  );
}

export function RankingView({ setId, title, subjectId, subjectName }: { setId: string; title: string; subjectId: string; subjectName: string }) {
  const [data, setData] = useState<RankingDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);
    try {
      setData(await api<RankingDTO>(`/api/ranking/${setId}`));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      loadingRef.current = false;
      setRefreshing(false);
    }
  }, [setId]);

  // 最新ランキングを自動取得（画面表示中のみ・アプリに戻ったときも更新）
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  if (error && !data) return <ErrorBox message={error} onRetry={() => void load()} />;
  if (!data) return <LoadingScreen message="ランキングをよみこみ中…" />;

  const top = (r: number) => data.entries.find((e) => e.rank === r);
  const rest = data.entries.filter((e) => e.rank > 3);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href={`/subjects/${subjectId}`} className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
        ◀ {subjectName}
      </Link>
      <header className="text-center">
        <p className="text-4xl" aria-hidden>🏆</p>
        <h1 className="mt-1 text-2xl font-extrabold">ランキング</h1>
        <p className="mt-1 text-sm font-bold text-ink-soft">{title}</p>
        <p className="mt-1 text-xs text-ink-soft">平均正答率（全挑戦の累計）で順位を決定・同率なら先に到達した人が上位</p>
      </header>

      <section className="card bg-candy-purple-soft/60 p-4 text-center">
        {data.me ? (
          <p className="font-extrabold">
            あなたは <span className="text-3xl text-candy-purple-deep">{data.me.rank}位</span>
            <span className="text-sm text-ink-soft"> / {data.entries.length}人中</span>
            <span className="mt-1 block text-sm">
              平均正答率 {data.me.percentText}%・{data.me.attemptsCount}回挑戦
            </span>
          </p>
        ) : (
          <p className="font-bold">
            まだランキングに参加していません。
            <br />
            クイズを1回完了すると参加できます！
          </p>
        )}
      </section>

      {data.entries.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">🌟</p>
          <p className="mt-2 font-bold">まだ誰も挑戦していません。一番乗りを目指そう！</p>
          <Link href={`/quiz/${setId}`} className="btn-pop pop-pink mt-4">
            ▶ クイズ開始
          </Link>
        </div>
      ) : (
        <>
          <section className="card px-3 pb-0 pt-5" aria-label="表彰台（1〜3位）">
            <div className="flex items-end gap-2">
              {PODIUM.map((cfg) => (
                <PodiumSlot key={cfg.rank} entry={top(cfg.rank)} cfg={cfg} />
              ))}
            </div>
          </section>

          {rest.length > 0 && (
            <ol className="card divide-y-2 divide-[#f4f0fc] overflow-hidden" aria-label="4位以下">
              {rest.map((e) => (
                <li key={e.rank} className={`flex items-center gap-3 px-4 py-3 ${e.isMe ? "bg-candy-purple-soft" : ""}`}>
                  <span className="w-10 shrink-0 text-center text-lg font-extrabold text-ink-soft">{e.rank}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {e.nickname}
                    {e.isMe && <span className="ml-1 rounded-full bg-candy-purple px-2 text-xs text-white">あなた</span>}
                  </span>
                  <span className="text-right">
                    <span className="block font-extrabold">{e.percentText}%</span>
                    <span className="block text-xs font-bold text-ink-soft">{e.attemptsCount}回</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
        <span>最終更新 {new Date(data.fetchedAt).toLocaleTimeString("ja-JP")}</span>
        <button className="btn-pop pop-white min-h-[40px] px-4 py-1 text-xs" onClick={() => void load()} disabled={refreshing}>
          {refreshing ? "更新中…" : "🔄 更新"}
        </button>
      </div>
      {error && <p className="text-center text-xs font-bold text-oops-deep">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/quiz/${setId}`} className="btn-pop pop-pink">
          ▶ 挑戦する
        </Link>
        <Link href="/" className="btn-pop pop-white">
          🏠 ホーム
        </Link>
      </div>
    </div>
  );
}
