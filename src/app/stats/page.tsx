"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDailyLog, series, shortDate, streak, totals, type DailyLog } from "@/lib/daily";
import { formatPercent } from "@/lib/stats";
import { drawShareImage } from "@/lib/chart-image";
import { canShareFile, shareVia, siteUrl } from "@/lib/share";
import { StudyChart } from "@/components/StudyChart";
import { ShareButtons } from "@/components/ShareButtons";
import { LoadingScreen } from "@/components/ui";

const PERIODS = [7, 14, 30] as const;

export default function StatsPage() {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => new Date());

  useEffect(() => setLog(loadDailyLog()), []);
  useEffect(() => () => void (imageUrl && URL.revokeObjectURL(imageUrl)), [imageUrl]);

  const points = useMemo(() => (log ? series(log, now, days) : []), [log, now, days]);
  const t = totals(points);
  const st = log ? streak(log, now) : 0;
  const rateText = t.answered ? formatPercent(t.correct, t.answered) : "0.0";
  const periodLabel = `直近${days}日（${shortDate(points[0]?.date ?? "0-0-0")}〜${shortDate(points.at(-1)?.date ?? "0-0-0")}）`;
  const hasAny = log ? Object.values(log).some((d) => d.answered > 0) : false;

  const shareText = `【再試回避委員会】📊 ${periodLabel}\n解いた問題 ${t.answered}問・正答率 ${rateText}%\n勉強した日 ${t.activeDays}日${st ? `・🔥${st}日連続` : ""}\n${siteUrl()}`;

  async function shareImage() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await drawShareImage({
        points,
        periodLabel,
        answered: t.answered,
        ratePercentText: rateText,
        activeDays: t.activeDays,
        streak: st,
        footer: siteUrl().replace(/^https?:\/\//, ""),
      });
      const file = new File([blob], `study-${points.at(-1)?.date ?? "chart"}.png`, { type: "image/png" });
      // 共有シート（LINE・インスタなど）が使えればそれで送る。だめなら画像を表示して長押し保存
      if (canShareFile(file) && (await shareVia({ files: [file], text: shareText }))) return;
      setImageUrl(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  if (!log) return <LoadingScreen message="記録をよみこみ中…" />;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
        ◀ ホーム
      </Link>
      <header>
        <h1 className="text-2xl font-extrabold">📊 学習記録</h1>
        <p className="text-sm font-bold text-ink-soft">日ごとの「解いた問題数」と「正答率」</p>
      </header>

      <div className="flex gap-2" role="tablist" aria-label="期間">
        {PERIODS.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={days === d}
            onClick={() => setDays(d)}
            className={`flex-1 rounded-full py-2 text-sm font-extrabold ${days === d ? "bg-candy-purple text-white" : "bg-white text-ink-soft"}`}
          >
            {d}日
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="card bg-candy-sky-soft p-3">
          <p className="text-xs font-bold text-ink-soft">解いた問題</p>
          <p className="text-2xl font-extrabold text-candy-sky-deep">{t.answered}問</p>
        </div>
        <div className="card bg-candy-pink-soft p-3">
          <p className="text-xs font-bold text-ink-soft">正答率</p>
          <p className="text-2xl font-extrabold text-candy-pink-deep">{t.answered ? `${rateText}%` : "—"}</p>
        </div>
        <div className="card bg-candy-mint-soft p-3">
          <p className="text-xs font-bold text-ink-soft">勉強した日</p>
          <p className="text-2xl font-extrabold text-candy-mint-deep">{t.activeDays}日</p>
        </div>
        <div className="card bg-candy-yellow-soft p-3">
          <p className="text-xs font-bold text-ink-soft">連続</p>
          <p className="text-2xl font-extrabold text-candy-yellow-deep">🔥{st}日</p>
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded bg-candy-sky" aria-hidden /> 解いた問題数
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1 w-4 rounded bg-candy-pink" aria-hidden /> 正答率
          </span>
        </div>
        <StudyChart points={points} />
        {!hasAny && <p className="mt-2 text-center text-sm font-bold text-ink-soft">まだ記録がありません。クイズを解くとここにグラフが出ます ✏️</p>}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-bold text-ink-soft">日ごとの数字を見る</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-xs text-ink-soft">
                <th className="py-1">日付</th>
                <th>解いた問題</th>
                <th>正解</th>
                <th>正答率</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-t border-[#f4f0fc]">
                  <td className="py-1 font-bold">{shortDate(p.date)}</td>
                  <td>{p.answered}</td>
                  <td>{p.correct}</td>
                  <td>{p.answered ? `${formatPercent(p.correct, p.answered)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">📣 シェアする</h2>
        <button className="btn-pop pop-purple w-full" onClick={() => void shareImage()} disabled={busy || !hasAny}>
          {busy ? "画像を作成中…" : "📸 グラフを画像でシェア"}
        </button>
        <ShareButtons text={shareText} />
        <p className="text-xs text-ink-soft">画像は共有シートから LINE やインスタに送れます。LINE ボタンは文章で送ります。</p>
        {imageUrl && (
          <div className="space-y-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="学習記録のグラフ画像" className="mx-auto w-full max-w-sm rounded-2xl border-2 border-[#f1ecfb]" />
            <p className="text-xs font-bold text-ink-soft">👆 画像を長押しして保存・共有できます</p>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-ink-soft">📱 記録はこの端末のブラウザに保存されています</p>
    </div>
  );
}
