"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ResultDTO } from "@/lib/api-types";
import { api, errorMessage } from "@/lib/api-client";
import { Confetti, ErrorBox, LoadingScreen } from "@/components/ui";
import { QuestionBody, TYPE_LABEL, answerLabel } from "@/components/QuestionBody";

const MESSAGES: Record<ResultDTO["direction"], { emoji: string; title: string; body: string; cls: string }> = {
  first: { emoji: "🎉", title: "ランキングに参加しました！", body: "初挑戦おつかれさま！ここからどんどん伸ばしていこう。", cls: "bg-candy-yellow-soft" },
  up: { emoji: "🚀", title: "平均正答率アップ！", body: "復習の成果が出てるね！この調子でランキング上位を目指そう！", cls: "bg-candy-mint-soft" },
  same: { emoji: "👍", title: "平均正答率キープ！", body: "安定した実力がついてきたね。苦手な問題を復習してさらに上へ！", cls: "bg-candy-sky-soft" },
  down: { emoji: "🌱", title: "今回はちょっと苦戦…でも大丈夫！", body: "間違えた問題は伸びしろ。下の復習で解説を確認して、もう一度挑戦してみよう！", cls: "bg-candy-pink-soft" },
};

export function ResultView({ setId, subjectId, subjectName, attemptId }: { setId: string; subjectId: string; subjectName: string; attemptId: string }) {
  const [data, setData] = useState<ResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api<ResultDTO>(`/api/attempts/${attemptId}`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorBox message={error} onRetry={() => void load()} />;
  if (!data) return <LoadingScreen message="結果をよみこみ中…" />;

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

      {/* 平均正答率（過去を含む） */}
      <section className="card overflow-hidden">
        <div className="bg-candy-purple px-5 py-2 text-sm font-extrabold text-white">📊 これまでの成績（ランキング対象）</div>
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
          <div className="col-span-2 rounded-2xl bg-candy-yellow-soft p-3">
            <p className="text-xs font-bold text-ink-soft">現在のランキング順位</p>
            <p className="text-3xl font-extrabold text-candy-yellow-deep">
              {data.rank ? (
                <>
                  {data.rank.rank <= 3 ? ["🥇", "🥈", "🥉"][data.rank.rank - 1] : "🏅"} {data.rank.rank}位
                  <span className="text-base text-ink-soft"> / {data.rank.total}人中</span>
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </section>

      <section className={`card p-5 text-center ${msg.cls}`}>
        <p className="text-3xl">{msg.emoji}</p>
        <p className="mt-1 text-lg font-extrabold">{msg.title}</p>
        <p className="mt-1 text-sm font-bold text-ink-soft">{msg.body}</p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href={`/quiz/${setId}?mode=new`} className="btn-pop pop-pink">
          ↺ もう一度挑戦
        </Link>
        <Link href={`/ranking/${setId}`} className="btn-pop pop-purple">
          🏆 ランキング
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
            const qv = { type: r.type, prompt: r.prompt, options: r.options };
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
                    <span className="block truncate font-bold">{r.prompt.replace("[[blank]]", "（　　）")}</span>
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

      <Link href={`/subjects/${subjectId}`} className="block text-center text-sm font-bold text-ink-soft">
        ◀ 問題セット一覧へ
      </Link>
    </div>
  );
}
