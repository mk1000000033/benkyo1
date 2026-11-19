"use client";
// 共通の小さなUI部品（進捗バー・紙吹雪・星・装飾・読み込み表示）
import { useMemo, type CSSProperties } from "react";

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label ?? "進捗"}>
      <div className="progress-track flex-1">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span aria-hidden className="text-xl">{pct >= 100 ? "🏁" : "⭐"}</span>
    </div>
  );
}

const CONFETTI_COLORS = ["#ff6fae", "#4cb8ff", "#9b7bff", "#ffc93c", "#3fd6a4"];

/** お祝いの紙吹雪（軽量なCSSアニメーション。動きを減らす設定では表示しない） */
export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dur: 2.2 + Math.random() * 1.8,
        delay: Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 120,
        round: Math.random() > 0.6,
      })),
    [count],
  );
  return (
    <div aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}vw`,
              background: p.color,
              borderRadius: p.round ? "9999px" : "3px",
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--drift": `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** 正解時に星がはじける演出 */
export function StarBurst() {
  const stars = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return { dx: Math.cos(angle) * 70, dy: Math.sin(angle) * 55, emoji: i % 2 ? "⭐" : "✨" };
      }),
    [],
  );
  return (
    <div aria-hidden className="motion-decor pointer-events-none absolute inset-0 flex items-center justify-center">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-star text-2xl"
          style={{ "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, animationDelay: `${i * 0.03}s` } as CSSProperties}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}

/** 背景のふわふわ装飾 */
export function Decor() {
  return (
    <div aria-hidden className="motion-decor pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span className="absolute left-[6%] top-[18%] animate-float text-3xl opacity-60">💊</span>
      <span className="absolute right-[8%] top-[30%] animate-float text-2xl opacity-50 [animation-delay:1s]">⭐</span>
      <span className="absolute left-[10%] bottom-[14%] animate-float text-2xl opacity-50 [animation-delay:2s]">🧪</span>
      <span className="absolute right-[12%] bottom-[22%] animate-float text-3xl opacity-50 [animation-delay:1.5s]">🌸</span>
    </div>
  );
}

export function LoadingScreen({ message = "よみこみ中…" }: { message?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-ink-soft" role="status">
      <div className="flex gap-2 text-3xl">
        <span className="animate-bounce">💊</span>
        <span className="animate-bounce [animation-delay:0.15s]">🧪</span>
        <span className="animate-bounce [animation-delay:0.3s]">⭐</span>
      </div>
      <p className="font-bold">{message}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card mx-auto max-w-md p-6 text-center" role="alert">
      <div className="text-4xl">🙏</div>
      <p className="mt-2 font-bold">{message}</p>
      {onRetry && (
        <button className="btn-pop pop-purple mt-4" onClick={onRetry}>
          もう一度ためす
        </button>
      )}
    </div>
  );
}

/** 日付 "2026-11-19" → "2026年11月19日" */
export function formatDateJa(date: string | null): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
