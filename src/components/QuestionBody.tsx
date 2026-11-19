"use client";
// 問題の表示（4択・○×・穴埋め）。クイズ画面と復習の両方で使う。
import { useState } from "react";
import { BLANK_TOKEN, type AnswerValue, type QuestionType, type QuizOption } from "@/lib/quiz-types";

export interface QuestionView {
  type: QuestionType;
  prompt: string;
  options?: QuizOption[] | null;
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

export function QuestionBody({
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
