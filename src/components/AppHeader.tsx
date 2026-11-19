"use client";
import Link from "next/link";
import { useParticipant } from "./ParticipantProvider";

export function AppHeader() {
  const { nickname } = useParticipant();
  return (
    <header className="safe-top sticky top-0 z-30 border-b-2 border-candy-purple-soft/60 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-1 text-base font-extrabold" aria-label="ホームへ">
          <span aria-hidden>💊</span>
          <span>
            みんなの<span className="text-candy-pink">薬学</span>クイズ
          </span>
        </Link>
        <Link
          href="/settings"
          className="flex max-w-[45%] items-center gap-1 rounded-full bg-candy-yellow-soft px-3 py-1.5 text-sm font-bold"
          aria-label="設定（ニックネーム変更）"
        >
          <span aria-hidden>🙂</span>
          <span className="truncate">{nickname}</span>
          <span aria-hidden className="text-ink-soft">⚙︎</span>
        </Link>
      </div>
    </header>
  );
}
