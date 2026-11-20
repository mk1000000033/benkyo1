"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FillBlank, QuestionImage, QuestionType, QuizOption, QuizSetFile, AnswerValue } from "@/lib/quiz-types";
import { findAttempt, type AttemptRecord } from "@/lib/records";
import { compareRates, formatDelta, formatPercent } from "@/lib/stats";
import { Confetti, LoadingScreen } from "@/components/ui";
import { ShareButtons } from "@/components/ShareButtons";
import { IinchoSays } from "@/components/Iincho";
import { resultComment } from "@/lib/iincho";
import { siteUrl } from "@/lib/share";
import { QuestionBody, TYPE_LABEL, answerLabel } from "@/components/QuestionBody";

type Direction = "first" | "up" | "down" | "same";

interface ReviewItem {
  index: number;
  type: QuestionType;
  prompt: string;
  image: QuestionImage | null;
  blanks: FillBlank[] | null;
  options: QuizOption[] | null;
  answer: AnswerValue;
  correctAnswer: AnswerValue;
  isCorrect: boolean;
  explanation: string;
  sourcePage: string | null;
}

function buildResult(a: AttemptRecord, versions: QuizSetFile[]) {
  const set = versions.find((v) => v.version === a.version);
  const { attemptsCount: n0, totalCorrect: c0, totalQuestions: q0 } = a.prev;
  const c1 = c0 + a.score;
  const q1 = q0 + a.questionCount;
  let direction: Direction = "first";
  if (n0 > 0) {
    const cmp = compareRates(c1, q1, c0, q0);
    direction = cmp > 0 ? "up" : cmp < 0 ? "down" : "same";
  }
  const review: ReviewItem[] = a.answers.flatMap((ans) => {
    const q = set?.questions[ans.index];
    if (!q) return [];
    return [{
      index: ans.index,
      type: q.type,
      prompt: q.prompt,
      image: q.image ?? null,
      blanks: q.type === "fill" ? q.blanks ?? null : null,
      options: q.type === "truefalse" ? null : q.options,
      answer: ans.answer,
      correctAnswer: q.answer,
      isCorrect: ans.isCorrect,
      explanation: q.explanation,
      sourcePage: q.sourcePage ?? null,
    }];
  });
  return {
    title: set?.title ?? "",
    setId: a.setId,
    score: a.score,
    questionCount: a.questionCount,
    thisPercentText: formatPercent(a.score, a.questionCount),
    average: { percentText: formatPercent(c1, q1), attemptsCount: n0 + 1 },
    previous: n0 > 0 ? { percentText: formatPercent(c0, q0) } : null,
    deltaText: n0 > 0 ? formatDelta(c0, q0, c1, q1) : null,
    direction,
    review,
  };
}

const MESSAGES: Record<Direction, { emoji: string; title: string; body: string; cls: string }> = {
  first: { emoji: "🎉", title: "初挑戦クリア！", body: "おつかれさま！何度も挑戦して平均正答率を上げていこう。", cls: "bg-candy-yellow-soft" },
  up: { emoji: "🚀", title: "平均正答率アップ！", body: "復習の成果が出てるね！この調子でどんどん伸ばそう！", cls: "bg-candy-mint-soft" },
  same: { emoji: "👍", title: "平均正答率キープ！", body: "安定した実力がついてきたね。苦手な問題を復習してさらに上へ！", cls: "bg-candy-sky-soft" },
  down: { emoji: "🌱", title: "今回はちょっと苦戦…でも大丈夫！", body: "間違えた問題は伸びしろ。下の復習で解説を確認して、もう一度挑戦してみよう！", cls: "bg-candy-pink-soft" },
};

export function ResultView({
  versions,
  subjectId,
  subjectName,
  attemptId,
  hasNote = false,
}: {
  versions: QuizSetFile[];
  subjectId: string;
  subjectName: string;
  attemptId: string;
  hasNote?: boolean;
}) {
  const [attempt, setAttempt] = useState<AttemptRecord | null | undefined>(undefined);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setAttempt(findAttempt(versions[0]?.id ?? "", attemptId));
  }, [versions, attemptId]);

  if (attempt === undefined) return <LoadingScreen message="結果をよみこみ中…" />;
  if (attempt === null) {
    return (
      <div className="card mx-auto max-w-md p-6 text-center">
        <div className="text-4xl">🔍</div>
        <p className="mt-2 font-bold">この挑戦の記録が見つかりませんでした。</p>
        <p className="mt-1 text-sm text-ink-soft">別の端末・ブラウザで解いた記録や、古い記録は表示できません。</p>
        <Link href={`/subjects/${subjectId}`} className="btn-pop pop-pink mt-4">
          ◀ 問題セット一覧へ
        </Link>
      </div>
    );
  }
  const data = buildResult(attempt, versions);
  const setId = data.setId;

  const msg = MESSAGES[data.direction];
  const celebrate = data.direction === "up" || data.direction === "first";
  const wrongCount = data.review.filter((r) => !r.isCorrect).length;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {celebrate && <Confetti />}
      <p className="text-center text-xs font-bold text-ink-soft">
        {subjectName}｜{data.title}
      </p>

      {/* 今回の結果 */}
      <section className="card animate-pop-in p-6 text-center">
        <p className="text-sm font-extrabold text-ink-soft">今回の得点</p>
        <p className="mt-1 text-6xl font-extrabold text-candy-pink">
          {data.score}
          <span className="text-2xl text-ink-soft"> / {data.questionCount}</span>
        </p>
        <p className="mt-1 font-bold">
          今回の正答率 <span className="text-xl font-extrabold text-candy-pink-deep">{data.thisPercentText}%</span>
        </p>
        <div className="mt-3 text-2xl" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (i < Math.round((data.score / data.questionCount) * 5) ? "⭐" : "☆")).join("")}
        </div>
      </section>

      {(() => {
        const ic = resultComment((data.score / data.questionCount) * 100, attemptId);
        return <IinchoSays mood={ic.mood} line={ic.line} title={`委員長の判定｜再試回避率 ${data.thisPercentText}%`} />;
      })()}

      {/* 平均正答率（過去を含む） */}
      <section className="card overflow-hidden">
        <div className="bg-candy-purple px-5 py-2 text-sm font-extrabold text-white">📊 これまでの成績</div>
        <div className="grid grid-cols-2 gap-3 p-5 text-center">
          <div className="rounded-2xl bg-candy-purple-soft p-3">
            <p className="text-xs font-bold text-ink-soft">平均正答率</p>
            <p className="text-3xl font-extrabold text-candy-purple-deep">{data.average.percentText}%</p>
            {data.deltaText && (
              <p
                className={`mt-1 text-sm font-extrabold ${
                  data.direction === "up" ? "text-candy-mint-deep" : data.direction === "down" ? "text-oops-deep" : "text-ink-soft"
                }`}
              >
                前回 {data.previous?.percentText}% → {data.deltaText}pt
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-candy-sky-soft p-3">
            <p className="text-xs font-bold text-ink-soft">完了回数（今回を含む）</p>
            <p className="text-3xl font-extrabold text-candy-sky-deep">{data.average.attemptsCount}回</p>
          </div>
        </div>
      </section>

      <section className={`card p-5 text-center ${msg.cls}`}>
        <p className="text-3xl">{msg.emoji}</p>
        <p className="mt-1 text-lg font-extrabold">{msg.title}</p>
        <p className="mt-1 text-sm font-bold text-ink-soft">{msg.body}</p>
        {hasNote && wrongCount > 0 && (
          <Link href={`/notes/${setId}`} className="btn-pop pop-mint mt-3 text-sm">
            📖 まとめで復習する
          </Link>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-extrabold">📣 結果をシェア</h2>
        <ShareButtons
          text={`【再試回避委員会】\n${subjectName}｜${data.title}\n今回 ${data.score}/${data.questionCount}問（${data.thisPercentText}%）🎯\n平均正答率 ${data.average.percentText}%（${data.average.attemptsCount}回目）\n${siteUrl()}`}
        />
        <Link href="/stats" className="block text-center text-sm font-bold text-candy-purple-deep">
          📊 日ごとの学習グラフを見る ▶
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href={`/quiz/${setId}?mode=new`} className="btn-pop pop-pink">
          ↺ もう一度挑戦
        </Link>
        <Link href={`/subjects/${subjectId}`} className="btn-pop pop-purple">
          📚 セット一覧
        </Link>
        <Link href="/" className="btn-pop pop-white">
          🏠 ホーム
        </Link>
      </div>

      {/* 全問復習 */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-lg font-extrabold">📝 全{data.questionCount}問の復習</h2>
          <button
            className="text-sm font-bold text-candy-purple-deep"
            onClick={() => setOpen(Object.fromEntries(data.review.filter((r) => !r.isCorrect).map((r) => [r.index, true])))}
          >
            まちがえた問題（{wrongCount}）を開く
          </button>
        </div>
        <ul className="space-y-3">
          {data.review.map((r) => {
            const isOpen = !!open[r.index];
            const qv = { type: r.type, prompt: r.prompt, options: r.options, image: r.image, blanks: r.blanks };
            return (
              <li key={r.index} className={`card overflow-hidden ${r.isCorrect ? "" : "border-oops/40"}`}>
                <button
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => setOpen((o) => ({ ...o, [r.index]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white ${
                      r.isCorrect ? "bg-candy-mint" : "bg-oops"
                    }`}
                    aria-label={r.isCorrect ? "正解" : "不正解"}
                  >
                    {r.isCorrect ? "○" : "×"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-ink-soft">
                      Q{r.index + 1}・<span className={`rounded px-1 ${TYPE_LABEL[r.type].cls}`}>{TYPE_LABEL[r.type].text}</span>
                    </span>
                    <span className="block truncate font-bold">{r.prompt.split("[[blank]]").join("（　　）")}</span>
                  </span>
                  <span aria-hidden className={`text-ink-soft transition ${isOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t-2 border-[#f1ecfb] p-4">
                    <QuestionBody q={qv} selected={null} reveal={{ answer: r.answer, correctAnswer: r.correctAnswer }} compact />
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-2xl bg-[#faf8ff] p-3 text-sm">
                      <dt className="font-extrabold text-ink-soft">あなたの回答</dt>
                      <dd className={`font-bold ${r.isCorrect ? "text-candy-mint-deep" : "text-oops-deep"}`}>{answerLabel(qv, r.answer)}</dd>
                      <dt className="font-extrabold text-ink-soft">正解</dt>
                      <dd className="font-bold text-candy-mint-deep">{answerLabel(qv, r.correctAnswer)}</dd>
                      <dt className="font-extrabold text-ink-soft">正誤</dt>
                      <dd className="font-bold">{r.isCorrect ? "⭕ 正解" : "❌ 不正解"}</dd>
                    </dl>
                    <div className="rounded-2xl bg-candy-purple-soft/50 p-3">
                      <p className="text-sm font-extrabold text-candy-purple-deep">💡 解説</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{r.explanation}</p>
                      {r.sourcePage && <p className="mt-1 text-xs font-bold text-ink-soft">📄 授業資料：{r.sourcePage}</p>}
                    </div>
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
