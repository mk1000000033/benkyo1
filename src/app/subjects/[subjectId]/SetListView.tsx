"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SubjectColor } from "@content/subjects";
import type { QuizSetSummary } from "@/lib/quiz-types";
import type { MySummaryDTO } from "@/lib/api-types";
import { api, errorMessage } from "@/lib/api-client";
import { COLOR, ErrorBox, formatDateJa } from "@/components/ui";

interface Props {
  subject: { id: string; name: string; emoji: string; color: SubjectColor };
  sets: QuizSetSummary[];
}

export function SetListView({ subject, sets }: Props) {
  const c = COLOR[subject.color];
  const [summary, setSummary] = useState<MySummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSummary(await api<MySummaryDTO>("/api/me/summary"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
        ◀ ホーム
      </Link>
      <header className={`card flex items-center gap-4 p-5 ${c.soft}`}>
        <span className="text-4xl" aria-hidden>{subject.emoji}</span>
        <div>
          <h1 className="text-2xl font-extrabold">{subject.name}</h1>
          <p className="text-sm font-bold text-ink-soft">問題セット {sets.length}個</p>
        </div>
      </header>

      {error && <ErrorBox message={error} onRetry={() => void load()} />}

      {sets.length === 0 && <p className="card p-6 text-center font-bold text-ink-soft">まだ問題セットがありません。お楽しみに！</p>}

      <ul className="space-y-4">
        {sets.map((s, i) => {
          const stat = summary?.stats[s.id];
          const progress = summary?.inProgress[s.id];
          const resumable = progress && !progress.outdated;
          return (
            <li key={s.id} className="card p-5">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-extrabold ${c.soft} ${c.text}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold leading-snug">{s.title}</h2>
                  <p className="mt-0.5 text-xs font-bold text-ink-soft">
                    {s.lectureDate && <>📅 {formatDateJa(s.lectureDate)}　</>}📝 問題数：{s.questionCount}問
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-candy-mint-soft p-2">
                  <p className="text-xs font-bold text-ink-soft">自分の平均正答率</p>
                  <p className="text-xl font-extrabold text-candy-mint-deep">
                    {summary ? (stat ? `${stat.percentText}%` : "未挑戦") : "…"}
                  </p>
                </div>
                <div className="rounded-2xl bg-candy-sky-soft p-2">
                  <p className="text-xs font-bold text-ink-soft">挑戦回数</p>
                  <p className="text-xl font-extrabold text-candy-sky-deep">{summary ? `${stat?.attemptsCount ?? 0}回` : "…"}</p>
                </div>
              </div>

              {resumable && (
                <p className="mt-3 rounded-2xl bg-candy-yellow-soft px-3 py-2 text-sm font-bold">
                  ⏸️ 途中のクイズがあります（{progress.answeredCount}/{progress.questionCount}問 回答済み）
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href={`/quiz/${s.id}`} className={`btn-pop ${resumable ? "pop-yellow" : "pop-pink"} text-sm`}>
                  {resumable ? "▶ 続きから再開" : "▶ クイズ開始"}
                </Link>
                <Link href={`/ranking/${s.id}`} className="btn-pop pop-purple text-sm">
                  🏆 ランキング
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
