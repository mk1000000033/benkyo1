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
import { groupSets, titleInGroup } from "@/lib/groups";

interface Props {
  subject: { id: string; name: string; emoji: string; color: SubjectColor };
  sets: QuizSetSummary[];
  themes?: { id: string; name: string; emoji: string; count: number }[];
}

type Local = Record<string, { record: SetRecord | null; progress: Progress | null }>;

const OTHER = "__other__";

export function SetListView({ subject, sets, themes = [] }: Props) {
  const c = COLOR[subject.color];
  // 端末の記録は表示後に読み込む（サーバー側の描画には存在しないため）
  const [local, setLocal] = useState<Local | null>(null);

  // フォルダ（年度など）にまとめる。フォルダ名が1つもなければ従来どおりの一覧
  const groups = groupSets(sets);
  const grouped = groups.some((g) => g.name !== null);
  const storageKey = `yq:folders:${subject.id}`;
  const [open, setOpen] = useState<string[]>(() => (groups[0] ? [groups[0].name ?? OTHER] : []));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setOpen(JSON.parse(saved) as string[]);
    } catch {
      /* 保存できない環境では最初のフォルダだけ開く */
    }
  }, [storageKey]);

  function toggle(key: string) {
    setOpen((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }

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

      {themes.length > 0 && (
        <section className="card p-4">
          <h2 className="font-extrabold">🎲 テーマ別ミックス</h2>
          <p className="text-xs font-bold text-ink-soft">年度をまたいで、同じテーマの問題をランダムに出題します</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <Link
                key={t.id}
                href={`/themes/${subject.id}/${t.id}`}
                className={`flex items-center gap-2 rounded-2xl border-2 border-[#ece6f8] bg-white px-3 py-2.5 active:scale-[0.98] ${c.text}`}
              >
                <span className="text-xl" aria-hidden>
                  {t.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold leading-tight text-ink">{t.name}</span>
                  <span className="block text-xs font-bold">{t.count}問</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sets.length === 0 && <p className="card p-6 text-center font-bold text-ink-soft">まだ問題セットがありません。お楽しみに！</p>}

      <ul className="space-y-4">
        {grouped ? (
          groups.map((g) => {
            const key = g.name ?? OTHER;
            const isOpen = open.includes(key);
            const done = g.sets.filter((x) => (local?.[x.id]?.record?.attemptsCount ?? 0) > 0).length;
            const paused = g.sets.some((x) => local?.[x.id]?.progress?.version === x.version);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-expanded={isOpen}
                  className={`card flex w-full items-center gap-3 p-4 text-left ${isOpen ? c.soft : ""}`}
                >
                  <span className="text-3xl" aria-hidden>
                    {isOpen ? "📂" : "📁"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-extrabold leading-snug">{g.name ?? "その他"}</span>
                    <span className="block text-xs font-bold text-ink-soft">
                      {g.sets.length}セット　✅ 取り組んだ {local ? done : "…"}/{g.sets.length}
                      {paused && "　⏸️ 途中あり"}
                    </span>
                  </span>
                  <span aria-hidden className={`text-ink-soft transition ${isOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <ul className={`mt-3 space-y-4 border-l-4 pl-3 ${c.ring}`}>
                    {g.sets.map((s) => (
                      <SetCard key={s.id} s={s} index={null} title={titleInGroup(s.title, s.group)} local={local} c={c} />
                    ))}
                  </ul>
                )}
              </li>
            );
          })
        ) : (
          sets.map((s, i) => <SetCard key={s.id} s={s} index={i + 1} title={s.title} local={local} c={c} />)
        )}
      </ul>
    </div>
  );
}

interface CardProps {
  s: QuizSetSummary;
  index: number | null;
  title: string;
  local: Local | null;
  c: (typeof COLOR)[SubjectColor];
}

function SetCard({ s, index, title, local, c }: CardProps) {
  const rec = local?.[s.id]?.record;
  const progress = local?.[s.id]?.progress;
  const resumable = progress && progress.version === s.version;
  const lastAt = lastCompletedAt(rec ?? null);
  const last = lastAt ? formatLastDate(lastAt) : null;
  return (
    <li className="card p-5">
      <div className="flex items-start gap-3">
        {index !== null && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-extrabold ${c.soft} ${c.text}`}>
            {index}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-snug">{title}</h2>
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

      <div className={`mt-4 grid gap-2 ${s.hasNote ? "grid-cols-3" : "grid-cols-2"}`}>
        {s.hasNote && (
          <Link href={`/notes/${s.id}`} className="btn-pop pop-mint px-2 text-sm">
            📖 まとめ
          </Link>
        )}
        <Link href={`/cards/${s.id}`} className="btn-pop pop-yellow px-2 text-sm">
          🃏 カード
        </Link>
        <Link href={`/quiz/${s.id}`} className={`btn-pop ${resumable ? "pop-purple" : "pop-pink"} px-2 text-sm`}>
          {resumable ? "▶ 続きから" : "▶ クイズ"}
        </Link>
      </div>
    </li>
  );
}
