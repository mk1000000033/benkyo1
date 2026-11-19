"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SubjectColor } from "@content/subjects";
import type { QuizSetSummary } from "@/lib/quiz-types";
import { lastCompletedAt, loadProgress, loadRecord, type Progress, type SetRecord } from "@/lib/records";
import { formatLastDate } from "@/lib/dates";
import { formatPercent } from "@/lib/stats";
import { COLOR } from "@/lib/colors";
import { formatDateJa } from "@/components/ui";

interface Props {
  subject: { id: string; name: string; emoji: string; color: SubjectColor };
  sets: QuizSetSummary[];
}

type Local = Record<string, { record: SetRecord | null; progress: Progress | null }>;

export function SetListView({ subject, sets }: Props) {
  const c = COLOR[subject.color];
  // 端末の記録は表示後に読み込む（サーバー側の描画には存在しないため）
  const [local, setLocal] = useState<Local | null>(null);

  useEffect(() => {
    const next: Local = {};
    for (const s of sets) next[s.id] = { record: loadRecord(s.id), progress: loadProgress(s.id) };
    setLocal(next);
  }, [sets]);

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

      {sets.length === 0 && <p className="card p-6 text-center font-bold text-ink-soft">まだ問題セットがありません。お楽しみに！</p>}

      <ul className="space-y-4">
        {sets.map((s, i) => {
          const rec = local?.[s.id]?.record;
          const progress = local?.[s.id]?.progress;
          const resumable = progress && progress.version === s.version;
          const lastAt = lastCompletedAt(rec ?? null);
          const last = lastAt ? formatLastDate(lastAt) : null;
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
                    {local ? (rec && rec.attemptsCount > 0 ? `${formatPercent(rec.totalCorrect, rec.totalQuestions)}%` : "未挑戦") : "…"}
                  </p>
                </div>
                <div className="rounded-2xl bg-candy-sky-soft p-2">
                  <p className="text-xs font-bold text-ink-soft">取り組んだ回数</p>
                  <p className="text-xl font-extrabold text-candy-sky-deep">{local ? `${rec?.attemptsCount ?? 0}回` : "…"}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-candy-purple-soft p-2">
                  <p className="text-xs font-bold text-ink-soft">📅 最後に取り組んだ日</p>
                  <p className="flex items-center justify-center gap-2">
                    <span className="whitespace-nowrap text-lg font-extrabold text-candy-purple-deep">
                      {!local ? "…" : last ? last.date : "まだありません"}
                    </span>
                    {last && (
                      <span className="whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-xs font-bold text-candy-purple-deep">{last.relative}</span>
                    )}
                  </p>
                </div>
              </div>

              {resumable && (
                <p className="mt-3 rounded-2xl bg-candy-yellow-soft px-3 py-2 text-sm font-bold">
                  ⏸️ 途中のクイズがあります（{progress.answers.length}/{progress.questionCount}問 回答済み）
                </p>
              )}

              <Link href={`/quiz/${s.id}`} className={`btn-pop ${resumable ? "pop-yellow" : "pop-pink"} mt-4 w-full`}>
                {resumable ? "▶ 続きから再開" : "▶ クイズ開始"}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
