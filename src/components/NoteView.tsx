// まとめ（学習ノート）の表示
import Link from "next/link";
import type { ReactNode } from "react";
import { RichText } from "@/components/RichText";
export { RichText };
import type { NoteBlock, NoteColor, NoteFile } from "@/lib/note-types";
import { COLOR } from "@/lib/colors";

/** **太字** と ==マーカー== に対応した文章表示 */
const BULLET: Record<NoteColor, string> = {
  pink: "bg-candy-pink",
  sky: "bg-candy-sky",
  purple: "bg-candy-purple",
  yellow: "bg-candy-yellow",
  mint: "bg-candy-mint",
};

function Block({ block, color }: { block: NoteBlock; color: NoteColor }) {
  const c = COLOR[color];
  switch (block.type) {
    case "image":
      return (
        <figure className="rounded-2xl border-2 border-[#ece6f8] bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} className={block.size === "large" ? "mx-auto h-auto w-full max-w-md" : "mx-auto h-auto max-h-60 w-auto max-w-full object-contain"} />
          {block.caption && <figcaption className="mt-1 text-center text-xs font-bold text-ink-soft">{block.caption}</figcaption>}
        </figure>
      );
    case "text":
      return (
        <p className="leading-loose">
          <RichText text={block.text} />
        </p>
      );
    case "points":
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span aria-hidden className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${BULLET[color]}`} />
              <span>
                <RichText text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="space-y-0">
          {block.items.map((item, i) => (
            <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
              {i < block.items.length - 1 && <span aria-hidden className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${c.soft}`} />}
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${BULLET[color]}`}>
                {i + 1}
              </span>
              <span className="pt-1 leading-relaxed">
                <RichText text={item} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#f1ecfb]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className={c.soft}>
                {block.headers.map((h, i) => (
                  <th key={i} className={`px-3 py-2 text-left font-extrabold ${c.text}`}>
                    <RichText text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t-2 border-[#f4f0fc] even:bg-[#fcfbff]">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3 py-2 align-top ${j === 0 ? "font-bold" : ""}`}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "tip":
      return (
        <div className="rounded-2xl bg-candy-yellow-soft p-3">
          <p className="text-sm font-extrabold text-candy-yellow-deep">{block.label ?? "💡 ポイント"}</p>
          <p className="mt-1 leading-relaxed">
            <RichText text={block.text} />
          </p>
        </div>
      );
    case "caution":
      return (
        <div className="rounded-2xl border-2 border-oops/40 bg-oops-soft p-3">
          <p className="text-sm font-extrabold text-oops-deep">{block.label ?? "⚠️ ひっかけ注意"}</p>
          <p className="mt-1 leading-relaxed">
            <RichText text={block.text} />
          </p>
        </div>
      );
    case "formula":
      return (
        <div className="rounded-2xl border-2 border-dashed border-candy-purple/50 bg-white p-3">
          <p className="text-xs font-extrabold text-candy-purple-deep">🧮 公式</p>
          <p className="mt-1 text-lg font-extrabold leading-snug">
            <RichText text={block.formula} />
          </p>
          {block.note && (
            <p className="mt-1 text-sm text-ink-soft">
              <RichText text={block.note} />
            </p>
          )}
          {block.example && (
            <p className="mt-2 rounded-xl bg-candy-purple-soft/60 px-3 py-2 text-sm leading-relaxed">
              <span className="font-extrabold">✏️ 例）</span>
              <RichText text={block.example} />
            </p>
          )}
        </div>
      );
  }
}

/** 読むのにかかる時間の目安（日本語 約500文字/分） */
function readingMinutes(note: NoteFile): number {
  const chars = JSON.stringify(note.sections).length + note.lead.length;
  return Math.max(1, Math.round(chars / 900)); // JSONの記号分を差し引いた概算
}

const ORDER: NoteColor[] = ["pink", "sky", "purple", "mint", "yellow"];

export function NoteView({
  note,
  title,
  subjectName,
  setId,
  subjectId,
}: {
  note: NoteFile;
  title: string;
  subjectName: string;
  setId: string;
  subjectId: string;
}): ReactNode {
  return (
    <article className="mx-auto max-w-xl space-y-5">
      <Link href={`/subjects/${subjectId}`} className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
        ◀ {subjectName}
      </Link>

      <header className="card relative overflow-hidden p-5">
        <div aria-hidden className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-candy-mint-soft" />
        <p className="relative inline-block rounded-full bg-candy-mint px-3 py-0.5 text-xs font-extrabold text-white">📖 まとめ</p>
        <h1 className="relative mt-2 text-2xl font-extrabold leading-snug">{title}</h1>
        <p className="relative mt-2 leading-relaxed">
          <RichText text={note.lead} />
        </p>
        <p className="relative mt-2 text-xs font-bold text-ink-soft">⏱️ 約{readingMinutes(note)}分で読めます</p>
      </header>

      <section className="card p-5">
        <h2 className="font-extrabold">🎯 この回でわかること</h2>
        <ul className="mt-2 space-y-1.5">
          {note.goals.map((g, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span aria-hidden className="text-candy-mint-deep">✔︎</span>
              <span>
                <RichText text={g} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="もくじ" className="flex flex-wrap gap-2">
        {note.sections.map((s, i) => {
          const c = COLOR[s.color ?? ORDER[i % ORDER.length]];
          return (
            <a key={i} href={`#sec-${i + 1}`} className={`rounded-full px-3 py-1.5 text-sm font-bold ${c.soft} ${c.text}`}>
              {s.emoji} {s.title}
            </a>
          );
        })}
      </nav>

      {note.sections.map((s, i) => {
        const color = s.color ?? ORDER[i % ORDER.length];
        const c = COLOR[color];
        return (
          <section key={i} id={`sec-${i + 1}`} className="card scroll-mt-20 overflow-hidden">
            <div className={`flex items-center gap-3 px-5 py-3 ${c.soft}`}>
              <span className="text-3xl" aria-hidden>
                {s.emoji}
              </span>
              <h2 className="min-w-0 flex-1 text-lg font-extrabold leading-snug">{s.title}</h2>
              {s.sourcePage && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink-soft">📄 {s.sourcePage}</span>}
            </div>
            <div className="space-y-4 p-5">
              {s.blocks.map((b, j) => (
                <Block key={j} block={b} color={color} />
              ))}
            </div>
          </section>
        );
      })}

      {note.keywords && note.keywords.length > 0 && (
        <section className="card p-5">
          <h2 className="font-extrabold">📚 キーワード集</h2>
          <dl className="mt-3 space-y-2">
            {note.keywords.map((k, i) => (
              <div key={i} className="rounded-2xl bg-[#faf8ff] px-3 py-2">
                <dt className="font-extrabold text-candy-purple-deep">{k.term}</dt>
                <dd className="text-sm leading-relaxed">
                  <RichText text={k.desc} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="card bg-candy-pink-soft/60 p-5 text-center">
        <p className="text-3xl" aria-hidden>
          ✏️
        </p>
        <p className="mt-1 font-extrabold">読み終わったら、クイズで確認しよう！</p>
        <Link href={`/quiz/${setId}`} className="btn-pop pop-pink mt-3 w-full text-lg">
          ▶ クイズに挑戦
        </Link>
      </section>
    </article>
  );
}
