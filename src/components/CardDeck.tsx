"use client";
// 暗記カード：タップでめくって「覚えた／まだ」を仕分ける
import Link from "next/link";
import { useState } from "react";
import type { FlashCard } from "@/lib/cards";
import { shuffle } from "@/lib/shuffle";
import { cardsComment } from "@/lib/iincho";
import { ProgressBar } from "./ui";
import { IinchoSays } from "./Iincho";

const KIND_LABEL: Record<FlashCard["kind"], { text: string; cls: string }> = {
  keyword: { text: "📚 キーワード", cls: "bg-candy-yellow-soft text-candy-yellow-deep" },
  choice: { text: "4択から", cls: "bg-candy-sky-soft text-candy-sky-deep" },
  truefalse: { text: "○か×か？", cls: "bg-candy-pink-soft text-candy-pink-deep" },
  fill: { text: "空欄を思い出そう", cls: "bg-candy-purple-soft text-candy-purple-deep" },
};

export function CardDeck({ title, emoji, cards, backHref, backLabel }: { title: string; emoji: string; cards: FlashCard[]; backHref: string; backLabel: string }) {
  const [deck, setDeck] = useState<FlashCard[]>(cards);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [round, setRound] = useState(1);

  function restart(next: FlashCard[], nextRound: number) {
    setDeck(next);
    setIdx(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
    setRound(nextRound);
    window.scrollTo({ top: 0 });
  }

  function mark(ok: boolean) {
    const id = deck[idx].id;
    if (ok) setKnown((k) => [...k, id]);
    else setUnknown((u) => [...u, id]);
    setFlipped(false);
    setIdx(idx + 1);
  }

  const header = (
    <div className="flex items-center justify-between gap-2">
      <Link href={backHref} className="shrink-0 whitespace-nowrap text-sm font-bold text-ink-soft">
        ◀ {backLabel}
      </Link>
      <p className="min-w-0 truncate text-right text-xs font-bold text-ink-soft">
        🃏 {emoji} {title}
      </p>
    </div>
  );

  // ---------- 最後まで終わった ----------
  if (idx >= deck.length) {
    const c = cardsComment(known.length, deck.length, `${title}-${round}`);
    const rest = deck.filter((card) => unknown.includes(card.id));
    return (
      <div className="mx-auto max-w-xl space-y-5">
        {header}
        <section className="card p-6 text-center">
          <p className="text-4xl" aria-hidden>
            🃏
          </p>
          <h1 className="mt-1 text-xl font-extrabold">{round}周目 おわり！</h1>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-candy-mint-soft p-3">
              <p className="text-xs font-bold text-ink-soft">😎 覚えた</p>
              <p className="text-3xl font-extrabold text-candy-mint-deep">{known.length}枚</p>
            </div>
            <div className="rounded-2xl bg-candy-pink-soft p-3">
              <p className="text-xs font-bold text-ink-soft">😵 まだ</p>
              <p className="text-3xl font-extrabold text-candy-pink-deep">{unknown.length}枚</p>
            </div>
          </div>
        </section>
        <IinchoSays mood={c.mood} line={c.line} />
        <div className="space-y-3">
          {rest.length > 0 && (
            <button className="btn-pop pop-pink w-full text-lg" onClick={() => restart(shuffle(rest), round + 1)}>
              🔁 「まだ」の {rest.length}枚だけもう一周
            </button>
          )}
          <button className="btn-pop pop-white w-full" onClick={() => restart(shuffle(cards), 1)}>
            🔀 全部シャッフルして最初から
          </button>
          <Link href={backHref} className="btn-pop pop-purple w-full">
            ◀ {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const card = deck[idx];
  const label = KIND_LABEL[card.kind];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {header}
      <div className="flex items-center justify-between text-sm font-extrabold">
        <span className="rounded-full bg-candy-purple px-4 py-1 text-white">
          {idx + 1} / {deck.length}
        </span>
        <span className="text-ink-soft">
          😎 {known.length}　😵 {unknown.length}
          {round > 1 && `　(${round}周目)`}
        </span>
      </div>
      <ProgressBar value={idx} max={deck.length} label="めくったカード" />

      <button
        type="button"
        key={card.id}
        className={`flip-card block w-full text-left ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "カードのうら（タップでおもてに戻す）" : "カードのおもて（タップでめくる）"}
      >
        <div className="flip-inner">
          <div className="flip-face card flex min-h-[260px] flex-col p-5">
            <span className={`self-start rounded-full px-3 py-0.5 text-xs font-extrabold ${label.cls}`}>{label.text}</span>
            <p className={`my-auto py-4 font-extrabold leading-relaxed ${card.kind === "keyword" ? "text-center text-2xl" : "text-lg"}`}>{card.front}</p>
            <p className="text-center text-xs font-bold text-ink-soft">👆 タップしてめくる</p>
          </div>
          <div className="flip-face flip-back card flex min-h-[260px] flex-col bg-candy-mint-soft/40 p-5">
            <span className="self-start rounded-full bg-candy-mint px-3 py-0.5 text-xs font-extrabold text-white">こたえ</span>
            <p className={`mt-3 font-extrabold leading-snug text-candy-mint-deep ${card.back.length > 14 ? "text-lg" : "text-center text-2xl"}`}>{card.back}</p>
            {card.detail && <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-relaxed">💡 {card.detail}</p>}
            <p className="mt-auto pt-3 text-right text-[11px] font-bold text-ink-soft">📂 {card.source}</p>
          </div>
        </div>
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-pop pop-pink text-lg" onClick={() => mark(false)}>
            😵 まだ
          </button>
          <button className="btn-pop pop-mint text-lg" onClick={() => mark(true)}>
            😎 覚えた
          </button>
        </div>
      ) : (
        <button className="btn-pop pop-white w-full" onClick={() => setFlipped(true)}>
          🔄 めくる
        </button>
      )}
    </div>
  );
}
