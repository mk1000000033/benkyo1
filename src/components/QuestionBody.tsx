"use client";
// 問題の表示（4択・○×・穴埋め）。クイズ画面と復習の両方で使う。
import { useState } from "react";
import { BLANK_JOIN, BLANK_TOKEN, type AnswerValue, type FillBlank, type QuestionImage, type QuestionType, type QuizOption } from "@/lib/quiz-types";

export interface QuestionView {
  type: QuestionType;
  prompt: string;
  options?: QuizOption[] | null;
  image?: QuestionImage | null;
  /** 空欄が複数ある穴埋めのとき */
  blanks?: FillBlank[] | null;
}

export interface RevealView {
  answer: AnswerValue;
  correctAnswer: AnswerValue;
}

export const TYPE_LABEL: Record<QuestionType, { text: string; cls: string }> = {
  choice: { text: "4択", cls: "bg-candy-sky-soft text-candy-sky-deep" },
  truefalse: { text: "○×", cls: "bg-candy-pink-soft text-candy-pink-deep" },
  fill: { text: "穴埋め", cls: "bg-candy-purple-soft text-candy-purple-deep" },
};

export function answerLabel(q: QuestionView, value: AnswerValue | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (q.type === "truefalse") return value === true ? "○（正しい）" : "×（誤り）";
  if (q.blanks && q.blanks.length > 1 && typeof value === "string") {
    return value.split(BLANK_JOIN).map((id, i) => q.blanks![i]?.options.find((o) => o.id === id)?.text ?? "—").join(" ／ ");
  }
  return q.options?.find((o) => o.id === value)?.text ?? String(value);
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function optionClass(state: "idle" | "selected" | "correct" | "wrong" | "faded") {
  switch (state) {
    case "selected":
      return "border-candy-purple bg-candy-purple-soft";
    case "correct":
      return "border-candy-mint bg-candy-mint-soft";
    case "wrong":
      return "border-oops bg-oops-soft";
    case "faded":
      return "border-gray-100 bg-white opacity-60";
    default:
      return "border-[#ece6f8] bg-white";
  }
}

function stateFor(id: AnswerValue, selected: AnswerValue | null, reveal: RevealView | null) {
  if (reveal) {
    if (id === reveal.correctAnswer) return "correct" as const;
    if (id === reveal.answer) return "wrong" as const;
    return "faded" as const;
  }
  return id === selected ? ("selected" as const) : ("idle" as const);
}

/** 構造式などの画像。白い台紙にのせて、横幅いっぱいまで（タップで拡大） */
export function QuestionImageView({ image, compact = false }: { image: QuestionImage; compact?: boolean }) {
  const [zoom, setZoom] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setZoom(true)}
        className={`mb-4 block w-full overflow-hidden rounded-2xl border-2 border-[#ece6f8] bg-white ${compact ? "p-2" : "p-3"}`}
        aria-label={`${image.alt}（タップで拡大）`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} className={`mx-auto h-auto w-auto max-w-full object-contain ${compact ? "max-h-40" : "max-h-64"}`} />
        <span className="mt-1 block text-right text-[11px] font-bold text-ink-soft">🔍 タップで拡大</span>
      </button>
      {zoom && (
        <div
          role="dialog"
          aria-label="画像の拡大表示"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setZoom(false)}
        >
          <div className="max-h-full w-full max-w-3xl overflow-auto rounded-2xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt} className="mx-auto h-auto w-full" />
            <p className="mt-2 text-center text-sm font-bold text-ink-soft">タップで閉じる</p>
          </div>
        </div>
      )}
    </>
  );
}

export function QuestionBody(props: {
  q: QuestionView;
  selected: AnswerValue | null;
  reveal: RevealView | null;
  onSelect?: (v: AnswerValue) => void;
  compact?: boolean;
}) {
  const multi = props.q.type === "fill" && !!props.q.blanks && props.q.blanks.length > 1;
  const body = multi ? <MultiFillBody {...props} /> : <QuestionBodyInner {...props} />;
  if (!props.q.image) return body;
  return (
    <div>
      <QuestionImageView image={props.q.image} compact={props.compact} />
      {body}
    </div>
  );
}

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥"];

/** 空欄が複数ある穴埋め。全部の空欄を選んだら onSelect に "id|id|id" を渡す */
function MultiFillBody({
  q,
  reveal,
  onSelect,
  compact = false,
}: {
  q: QuestionView;
  selected: AnswerValue | null;
  reveal: RevealView | null;
  onSelect?: (v: AnswerValue) => void;
  compact?: boolean;
}) {
  const blanks = q.blanks!;
  const locked = !!reveal || !onSelect;
  const [picks, setPicks] = useState<(string | null)[]>(() => blanks.map(() => null));
  const [open, setOpen] = useState<number | null>(null);
  const shown: (string | null)[] = reveal && typeof reveal.answer === "string" ? reveal.answer.split(BLANK_JOIN) : picks;
  const correct: string[] = reveal && typeof reveal.correctAnswer === "string" ? reveal.correctAnswer.split(BLANK_JOIN) : [];
  const parts = q.prompt.split(BLANK_TOKEN);
  const promptCls = compact ? "text-base" : "text-lg";

  function pick(bi: number, id: string) {
    const next = picks.map((p, i) => (i === bi ? id : p));
    setPicks(next);
    // まだ空いている次の空欄を自動で開く
    const nextOpen = next.findIndex((p) => p === null);
    setOpen(nextOpen >= 0 ? nextOpen : null);
    if (next.every((p) => p !== null)) onSelect?.(next.join(BLANK_JOIN));
  }

  return (
    <div>
      <p className={`${promptCls} whitespace-pre-wrap font-bold leading-loose`}>
        {parts.map((text, i) => (
          <span key={i}>
            {text}
            {i < blanks.length && (() => {
              const id = shown[i];
              const st = reveal ? (id === correct[i] ? "correct" : "wrong") : open === i ? "selected" : id != null ? "selected" : "idle";
              const label = id != null ? blanks[i].options.find((o) => o.id === id)?.text ?? "—" : `${CIRCLED[i]} タップ`;
              return (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setOpen((v) => (v === i ? null : i))}
                  className={`mx-1 inline-flex min-h-[40px] min-w-[6em] items-center justify-center rounded-xl border-2 border-dashed px-3 align-middle font-extrabold ${optionClass(st)} ${!locked && id == null && open !== i ? "animate-pulse" : ""}`}
                  aria-label={id != null ? `空欄${i + 1}：${label}（タップで選び直す）` : `空欄${i + 1}をタップして選ぶ`}
                  aria-expanded={open === i}
                >
                  {label}
                </button>
              );
            })()}
          </span>
        ))}
      </p>
      {reveal && reveal.answer !== reveal.correctAnswer && (
        <p className="mt-2 text-sm font-bold text-candy-mint-deep">
          正解：{correct.map((id, i) => `${CIRCLED[i]} ${blanks[i]?.options.find((o) => o.id === id)?.text ?? "—"}`).join("　")}
        </p>
      )}
      {!locked && open !== null && (
        <div className="mt-4 animate-pop-in rounded-3xl bg-candy-purple-soft/60 p-3">
          <p className="mb-2 text-xs font-bold text-ink-soft">空欄{CIRCLED[open]}に入ることばを選ぼう</p>
          <div className="flex flex-wrap gap-2">
            {blanks[open].options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(open, o.id)}
                className={`min-h-[44px] rounded-2xl border-2 px-4 py-2 text-left font-bold ${optionClass(o.id === picks[open] ? "selected" : "idle")}`}
              >
                {o.text}
              </button>
            ))}
          </div>
        </div>
      )}
      {!locked && open === null && picks.some((p) => p === null) && (
        <p className="mt-3 text-sm font-bold text-ink-soft">👆 空欄を1つずつタップして、全部うめてね（{picks.filter((p) => p !== null).length}/{blanks.length}）</p>
      )}
    </div>
  );
}

function QuestionBodyInner({
  q,
  selected,
  reveal,
  onSelect,
  compact = false,
}: {
  q: QuestionView;
  selected: AnswerValue | null;
  reveal: RevealView | null;
  onSelect?: (v: AnswerValue) => void;
  compact?: boolean;
}) {
  const locked = !!reveal || !onSelect;
  const [chooserOpen, setChooserOpen] = useState(false);
  const promptCls = compact ? "text-base" : "text-lg";

  if (q.type === "fill") {
    const [before, after] = q.prompt.split(BLANK_TOKEN);
    const filled = reveal ? reveal.answer : selected;
    const blankState = reveal ? (reveal.answer === reveal.correctAnswer ? "correct" : "wrong") : filled != null ? "selected" : "idle";
    return (
      <div>
        <p className={`${promptCls} whitespace-pre-wrap font-bold leading-loose`}>
          {before}
          <button
            type="button"
            disabled={locked}
            onClick={() => setChooserOpen((v) => !v)}
            className={`mx-1 inline-flex min-h-[40px] min-w-[7em] items-center justify-center rounded-xl border-2 border-dashed px-3 align-middle font-extrabold ${optionClass(blankState)} ${!locked && filled == null ? "animate-pulse" : ""}`}
            aria-label={filled != null ? `空欄：${answerLabel(q, filled)}（タップで選び直す）` : "空欄をタップして選ぶ"}
            aria-expanded={chooserOpen}
          >
            {filled != null ? answerLabel(q, filled) : "？ タップ"}
          </button>
          {after}
        </p>
        {reveal && reveal.answer !== reveal.correctAnswer && (
          <p className="mt-2 text-sm font-bold text-candy-mint-deep">正解：{answerLabel(q, reveal.correctAnswer)}</p>
        )}
        {!locked && chooserOpen && (
          <div className="mt-4 animate-pop-in rounded-3xl bg-candy-purple-soft/60 p-3">
            <p className="mb-2 text-xs font-bold text-ink-soft">空欄に入ることばを選ぼう</p>
            <div className="flex flex-wrap gap-2">
              {q.options?.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onSelect?.(o.id);
                    setChooserOpen(false);
                  }}
                  className={`min-h-[44px] rounded-2xl border-2 px-4 py-2 text-left font-bold ${optionClass(o.id === selected ? "selected" : "idle")}`}
                >
                  {o.text}
                </button>
              ))}
            </div>
          </div>
        )}
        {!locked && !chooserOpen && selected == null && (
          <p className="mt-3 text-sm font-bold text-ink-soft">👆 空欄をタップして選択肢から選んでね</p>
        )}
      </div>
    );
  }

  if (q.type === "truefalse") {
    const opts: { v: boolean; mark: string; label: string; color: string }[] = [
      { v: true, mark: "○", label: "正しい", color: "text-candy-pink-deep" },
      { v: false, mark: "×", label: "誤り", color: "text-candy-sky-deep" },
    ];
    return (
      <div>
        <p className={`${promptCls} whitespace-pre-wrap font-bold leading-relaxed`}>{q.prompt}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {opts.map((o) => {
            const st = stateFor(o.v, selected, reveal);
            return (
              <button
                key={String(o.v)}
                type="button"
                disabled={locked}
                onClick={() => onSelect?.(o.v)}
                aria-pressed={selected === o.v}
                className={`flex flex-col items-center justify-center rounded-3xl border-[3px] ${compact ? "py-2" : "py-5"} transition ${optionClass(st)}`}
              >
                <span className={`${compact ? "text-3xl" : "text-5xl"} font-extrabold ${o.color}`}>{o.mark}</span>
                <span className="text-sm font-bold">{o.label}</span>
                {st === "correct" && reveal && <span className="text-xs font-bold text-candy-mint-deep">✓ 正解</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className={`${promptCls} whitespace-pre-wrap font-bold leading-relaxed`}>{q.prompt}</p>
      <div className="mt-4 space-y-2.5">
        {q.options?.map((o, i) => {
          const st = stateFor(o.id, selected, reveal);
          return (
            <button
              key={o.id}
              type="button"
              disabled={locked}
              onClick={() => onSelect?.(o.id)}
              aria-pressed={selected === o.id}
              className={`flex w-full items-center gap-3 rounded-2xl border-[3px] ${compact ? "p-2" : "p-3"} text-left transition ${optionClass(st)}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-white ${
                  st === "correct" ? "bg-candy-mint" : st === "wrong" ? "bg-oops" : st === "selected" ? "bg-candy-purple" : "bg-candy-sky"
                }`}
              >
                {st === "correct" ? "✓" : st === "wrong" ? "✗" : LETTERS[i]}
              </span>
              <span className="font-bold">{o.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
