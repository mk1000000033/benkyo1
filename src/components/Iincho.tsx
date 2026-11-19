// 委員長（オリジナルキャラクター）とふきだし
import type { Mood } from "@/lib/iincho";

function Face({ mood }: { mood: Mood }) {
  const mouth =
    mood === "proud" ? (
      <path d="M43 56 Q50 63 57 56" fill="none" stroke="#3a3350" strokeWidth={2.2} strokeLinecap="round" />
    ) : mood === "worried" ? (
      <path d="M44 59 Q47 56 50 59 Q53 62 56 59" fill="none" stroke="#3a3350" strokeWidth={2.2} strokeLinecap="round" />
    ) : mood === "sleepy" ? (
      <ellipse cx={50} cy={58} rx={3} ry={2.2} fill="#3a3350" />
    ) : (
      <path d="M45 58 L55 58" stroke="#3a3350" strokeWidth={2.2} strokeLinecap="round" />
    );
  const eyes =
    mood === "sleepy" ? (
      <>
        <path d="M38 45 L44 45" stroke="#3a3350" strokeWidth={2} strokeLinecap="round" />
        <path d="M56 45 L62 45" stroke="#3a3350" strokeWidth={2} strokeLinecap="round" />
      </>
    ) : mood === "proud" ? (
      <>
        <path d="M38 46 Q41 42 44 46" fill="none" stroke="#3a3350" strokeWidth={2} strokeLinecap="round" />
        <path d="M56 46 Q59 42 62 46" fill="none" stroke="#3a3350" strokeWidth={2} strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx={41} cy={45} r={2.2} fill="#3a3350" />
        <circle cx={59} cy={45} r={2.2} fill="#3a3350" />
      </>
    );
  return (
    <>
      {eyes}
      {mouth}
      {mood === "worried" && <path d="M66 34 q3 4 0 7 q-3 -3 0 -7" fill="#7fd0ff" />}
    </>
  );
}

export function IinchoAvatar({ mood = "ok", size = 64 }: { mood?: Mood; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="委員長">
      <circle cx={50} cy={50} r={48} fill="#eee8ff" />
      {/* ブレザーと腕章 */}
      <path d="M18 100 Q20 76 50 74 Q80 76 82 100 Z" fill="#3a3350" />
      <path d="M44 74 L50 86 L56 74 Z" fill="#ffffff" />
      <path d="M49 80 L51 80 L52 92 L50 95 L48 92 Z" fill="#ff6fae" />
      <rect x={20} y={84} width={20} height={8} rx={2} fill="#ff6fae" transform="rotate(-12 30 88)" />
      {/* 顔と髪 */}
      <circle cx={50} cy={46} r={23} fill="#ffe2cc" />
      <path d="M26 48 Q24 20 50 19 Q76 20 74 48 L74 56 Q70 40 68 33 L32 33 Q30 40 26 56 Z" fill="#2b2540" />
      <path d="M32 33 L68 33" stroke="#2b2540" strokeWidth={4} />
      {/* メガネ */}
      <circle cx={41} cy={45} r={7.5} fill="none" stroke="#3a3350" strokeWidth={2} />
      <circle cx={59} cy={45} r={7.5} fill="none" stroke="#3a3350" strokeWidth={2} />
      <path d="M48.5 45 L51.5 45" stroke="#3a3350" strokeWidth={2} />
      <circle cx={34} cy={53} r={3.2} fill="#ffb3cf" opacity={0.7} />
      <circle cx={66} cy={53} r={3.2} fill="#ffb3cf" opacity={0.7} />
      <Face mood={mood} />
    </svg>
  );
}

/** 委員長のひとこと（アバター＋ふきだし） */
export function IinchoSays({ mood, line, title }: { mood: Mood; line: string; title?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 animate-pop-in">
        <IinchoAvatar mood={mood} size={64} />
      </div>
      <div className="relative min-w-0 flex-1 rounded-3xl rounded-tl-md border-2 border-candy-purple-soft bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-extrabold text-candy-purple-deep">{title ?? "委員長"}</p>
        <p className="mt-0.5 font-bold leading-relaxed">{line}</p>
      </div>
    </div>
  );
}
