"use client";
// 新機能のお知らせポップアップ。まだ見ていないお知らせがあるときだけ、トップ画面で1回出す。
import Link from "next/link";
import { useEffect, useState } from "react";
import { LATEST_NEWS } from "@content/news";
import { IinchoAvatar } from "@/components/Iincho";

// 記録のリセット（yq: から始まるキー）では消えないよう、別の名前にしている
const SEEN_KEY = "rk:news:seen";

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function writeSeen(id: string) {
  try {
    localStorage.setItem(SEEN_KEY, id);
  } catch {
    /* 保存できなくても閉じるだけにする */
  }
}

export function NewsPopup() {
  const news = LATEST_NEWS;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (news && readSeen() !== news.id) setOpen(true);
  }, [news]);

  if (!news) return null;

  function close() {
    writeSeen(news!.id);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl bg-candy-yellow-soft px-4 py-2.5 text-left text-sm font-extrabold text-candy-yellow-deep"
      >
        <span aria-hidden>📣</span>
        <span className="min-w-0 flex-1 truncate">新機能のお知らせ（{news.date}）</span>
        <span aria-hidden>▶</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-title"
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
        >
          {/* 背景をタップしても閉じる */}
          <button type="button" aria-label="お知らせを閉じる" className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative max-h-[88vh] w-full max-w-md animate-pop-in overflow-y-auto rounded-[2rem] bg-white p-5 shadow-xl">
            <button
              type="button"
              onClick={close}
              aria-label="閉じる"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-extrabold text-ink-soft"
            >
              ✕
            </button>
            <div className="flex items-start gap-3 pr-10">
              <div className="shrink-0">
                <IinchoAvatar mood="proud" size={56} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink-soft">📣 {news.date}</p>
                <h2 id="news-title" className="text-xl font-extrabold">
                  新機能のお知らせ
                </h2>
                <p className="mt-1 text-sm font-bold leading-relaxed text-candy-purple-deep">{news.line}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {news.items.map((it) => {
                const body = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-candy-purple-soft text-xl" aria-hidden>
                      {it.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold">{it.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">{it.text}</span>
                    </span>
                    {it.href && (
                      <span className="shrink-0 self-center font-extrabold text-candy-purple" aria-hidden>
                        ▶
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={it.title}>
                    {it.href ? (
                      <Link href={it.href} onClick={close} className="flex gap-3 rounded-2xl border-2 border-[#ece6f8] p-3">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex gap-3 rounded-2xl border-2 border-[#ece6f8] p-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            <button type="button" onClick={close} className="btn-pop pop-pink mt-5 w-full text-lg">
              わかった！
            </button>
          </div>
        </div>
      )}
    </>
  );
}
