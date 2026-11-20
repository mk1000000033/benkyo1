"use client";
// テーマ別ミックス：年度をまたいで同じテーマの問題をランダムに出題する
//   ※ 問題セットの平均正答率には入りません（日ごとの学習記録には入ります）
import Link from "next/link";
import { useState } from "react";
import type { Theme } from "@content/themes";
import type { AnswerValue } from "@/lib/quiz-types";
import type { ThemeItem } from "@/lib/quiz-registry";
import { gradeAnswer } from "@/lib/grade";
import { recordDailyAnswer } from "@/lib/daily";
import { resultComment } from "@/lib/iincho";
import { formatPercent } from "@/lib/stats";
import { shuffle } from "@/lib/shuffle";
import { siteUrl } from "@/lib/share";
import { Confetti, ProgressBar, StarBurst } from "@/components/ui";
import { QuestionBody, TYPE_LABEL, answerLabel } from "@/components/QuestionBody";
import { IinchoSays } from "@/components/Iincho";
import { ShareButtons } from "@/components/ShareButtons";

interface Answered {
  answer: AnswerValue;
  isCorrect: boolean;
}

export function MixPlayer({ subject, theme, items }: { subject: { id: string; name: string }; theme: Theme; items: ThemeItem[] }) {
  const [deck, setDeck] = useState<ThemeItem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [selected, setSelected] = useState<AnswerValue | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [runId, setRunId] = useState("");

  const sizes = [10, 20].filter((n) => n < items.length);

  function start(n: number) {
    setDeck(shuffle(items).slice(0, n));
    setIdx(0);
    setAnswers([]);
    setSelected(null);
    setOpen({});
    setRunId(`${theme.id}-${Date.now()}`);
    window.scrollTo({ top: 0 });
  }

  // ---------- 開始画面 ----------
  if (!deck) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <Link href={`/subjects/${subject.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
          ◀ {subject.name}
        </Link>
        <section className="card p-6 text-center">
          <p className="text-5xl" aria-hidden>
            {theme.emoji}
          </p>
          <p className="mt-2 text-xs font-extrabold text-candy-purple-deep">🎲 テーマ別ミックス</p>
          <h1 className="text-2xl font-extrabold">{theme.name}</h1>
          <p className="mt-1 text-sm font-bold text-ink-soft">{theme.description}</p>
          <p className="mt-3 text-sm font-bold">
            {subject.name}の全セットから <span className="text-candy-pink-deep">{items.length}問</span>
          </p>
          <div className="mt-5 space-y-3">
            {sizes.map((n) => (
              <button key={n} className="btn-pop pop-pink w-full text-lg" onClick={() => start(n)}>
                ▶ ランダム {n}問
              </button>
            ))}
            <button className={`btn-pop ${sizes.length ? "pop-white" : "pop-pink text-lg"} w-full`} onClick={() => start(items.length)}>
              ▶ 全部（{items.length}問）
            </button>
          </div>
          <p className="mt-4 text-xs text-ink-soft">出題順は毎回ランダムです。ミックスの結果は各問題セットの平均正答率には入りません。</p>
        </section>
      </div>
    );
  }

  const total = deck.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  // ---------- 結果 ----------
  if (answers.length === total && idx >= total) {
    const pct = (correctCount / total) * 100;
    const c = resultComment(pct, runId);
    return (
      <div className="mx-auto max-w-xl space-y-5">
        {pct >= 80 && <Confetti />}
        <section className="card animate-pop-in p-6 text-center">
          <p className="text-xs font-extrabold text-candy-purple-deep">
            🎲 {theme.emoji} {theme.name}
          </p>
          <p className="mt-2 text-sm font-extrabold text-ink-soft">今回の得点</p>
          <p className="text-6xl font-extrabold text-candy-pink">
            {correctCount}
            <span className="text-2xl text-ink-soft"> / {total}</span>
          </p>
          <p className="mt-1 font-bold">
            正答率 <span className="text-xl font-extrabold text-candy-pink-deep">{formatPercent(correctCount, total)}%</span>
          </p>
        </section>
        <IinchoSays mood={c.mood} line={c.line} title={`委員長の判定｜再試回避率 ${formatPercent(correctCount, total)}%`} />
        <section className="card space-y-3 p-4">
          <h2 className="font-extrabold">📣 結果をシェア</h2>
          <ShareButtons
            text={`【再試回避委員会】🎲 テーマ別ミックス\n${subject.name}｜${theme.emoji}${theme.name}\n${correctCount}/${total}問（${formatPercent(correctCount, total)}%）\n${siteUrl()}`}
          />
        </section>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-pop pop-pink" onClick={() => start(total)}>
            ↺ 別の問題で
          </button>
          <Link href={`/subjects/${subject.id}`} className="btn-pop pop-white">
            ◀ テーマ一覧
          </Link>
        </div>
        <section>
          <h2 className="mb-2 text-lg font-extrabold">📝 全{total}問の復習</h2>
          <ul className="space-y-3">
            {deck.map((it, i) => {
              const q = it.question;
              const a = answers[i];
              const qv = { type: q.type, prompt: q.prompt, options: q.type === "truefalse" ? null : q.options, image: q.image ?? null, blanks: q.type === "fill" ? q.blanks ?? null : null };
              const isOpen = !!open[i];
              return (
                <li key={it.key} className={`card overflow-hidden ${a.isCorrect ? "" : "border-oops/40"}`}>
                  <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen((o) => ({ ...o, [i]: !isOpen }))} aria-expanded={isOpen}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white ${a.isCorrect ? "bg-candy-mint" : "bg-oops"}`}>
                      {a.isCorrect ? "○" : "×"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-ink-soft">{it.setTitle}</span>
                      <span className="block truncate font-bold">{q.prompt.split("[[blank]]").join("（　　）")}</span>
                    </span>
                    <span aria-hidden className={`text-ink-soft transition ${isOpen ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t-2 border-[#f1ecfb] p-4">
                      <QuestionBody q={qv} selected={null} reveal={{ answer: a.answer, correctAnswer: q.answer }} compact />
                      <p className="text-sm">
                        <b>あなたの回答：</b>
                        <span className={a.isCorrect ? "text-candy-mint-deep" : "text-oops-deep"}>{answerLabel(qv, a.answer)}</span>　<b>正解：</b>
                        <span className="text-candy-mint-deep">{answerLabel(qv, q.answer)}</span>
                      </p>
                      <div className="rounded-2xl bg-candy-purple-soft/50 p-3 text-sm leading-relaxed">💡 {q.explanation}</div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    );
  }

  // ---------- 出題 ----------
  const item = deck[idx];
  const q = item.question;
  const mine = answers[idx];
  const qView = { type: q.type, prompt: q.prompt, options: q.type === "truefalse" ? null : q.options, image: q.image ?? null, blanks: q.type === "fill" ? q.blanks ?? null : null };
  const type = TYPE_LABEL[q.type];

  function submit() {
    if (selected === null || mine) return;
    const ok = gradeAnswer(q, selected);
    if (ok === null) return;
    setAnswers((prev) => (prev.length === idx ? [...prev, { answer: selected, isCorrect: ok }] : prev));
    recordDailyAnswer(ok);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button className="shrink-0 whitespace-nowrap text-sm font-bold text-ink-soft" onClick={() => setDeck(null)}>
          ✕ やめる
        </button>
        <p className="min-w-0 truncate text-right text-xs font-bold text-ink-soft">
          🎲 {theme.emoji} {theme.name}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-candy-purple px-4 py-1 text-lg font-extrabold text-white">
          Q {idx + 1}
          <span className="text-sm opacity-80"> / {total}</span>
        </span>
        <span className="rounded-full bg-candy-yellow-soft px-4 py-1 font-extrabold text-candy-yellow-deep">⭐ 正解 {correctCount}</span>
      </div>
      <ProgressBar value={answers.length} max={total} label="回答した問題数" />
      <section key={item.key} className="card relative animate-pop-in p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-extrabold ${type.cls}`}>{type.text}</span>
          <span className="text-xs font-bold text-ink-soft">📂 {item.setTitle}</span>
        </div>
        <QuestionBody q={qView} selected={selected} reveal={mine ? { answer: mine.answer, correctAnswer: q.answer } : null} onSelect={mine ? undefined : setSelected} />
      </section>
      {!mine ? (
        <button className="btn-pop pop-pink w-full text-lg" disabled={selected === null} onClick={submit}>
          {selected === null ? "答えを選んでね" : "これで回答する！"}
        </button>
      ) : (
        <section className={`card relative overflow-hidden p-5 ${mine.isCorrect ? "animate-pop-in border-candy-mint bg-candy-mint-soft/50" : "animate-wiggle border-oops/50 bg-oops-soft"}`} aria-live="polite">
          {mine.isCorrect && <StarBurst />}
          <p className={`relative text-2xl font-extrabold ${mine.isCorrect ? "text-candy-mint-deep" : "text-oops-deep"}`}>
            {mine.isCorrect ? "⭕ せいかい！" : "🌱 おしい！"}
          </p>
          {!mine.isCorrect && (
            <p className="relative mt-2 font-bold">
              正解は <span className="rounded-lg bg-white px-2 py-0.5 text-candy-mint-deep">{answerLabel(qView, q.answer)}</span>
            </p>
          )}
          <div className="relative mt-4 rounded-2xl bg-white p-4">
            <p className="text-sm font-extrabold text-candy-purple-deep">💡 解説</p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{q.explanation}</p>
          </div>
          <button
            className={`btn-pop ${idx === total - 1 ? "pop-purple" : "pop-sky"} relative mt-4 w-full text-lg`}
            onClick={() => {
              setIdx(idx + 1);
              setSelected(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {idx === total - 1 ? "🏆 結果を見る" : "次の問題へ ▶"}
          </button>
        </section>
      )}
    </div>
  );
}
