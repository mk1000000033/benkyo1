"use client";
import { RichText } from "@/components/RichText";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SKIP_ANSWER, type AnswerValue, type QuizSetFile } from "@/lib/quiz-types";
import { gradeAnswer } from "@/lib/grade";
import { recordDailyAnswer } from "@/lib/daily";
import { addAnswer, completeAndSave, loadProgress, newAttemptId, saveProgress, type Progress } from "@/lib/records";
import { LoadingScreen, ProgressBar, StarBurst } from "@/components/ui";
import { QuestionBody, TYPE_LABEL, answerLabel } from "@/components/QuestionBody";

type Phase = "checking" | "choose" | "playing";

const PRAISE = ["せいかい！すごい！", "ナイス！その調子✨", "かんぺき！", "やったね！正解！", "さすが！🎉"];
const CHEER = [
  "おしい！解説でしっかり確認しよう",
  "ドンマイ！ここで覚えれば本番はバッチリ",
  "惜しい！次はきっと正解できるよ",
  "大丈夫！まちがえた問題こそ伸びしろ🌱",
];

export function QuizPlayer({ set, subjectName, forceNew }: { set: QuizSetFile; subjectName: string; forceNew: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [saved, setSaved] = useState<Progress | null>(null); // 途中の挑戦（再開の確認用）
  const [p, setP] = useState<Progress | null>(null);
  const [selected, setSelected] = useState<AnswerValue | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const finishing = useRef(false);

  function persist(next: Progress) {
    setP(next);
    if (!saveProgress(next)) setStorageWarning(true);
  }

  function startNew() {
    persist({
      attemptId: newAttemptId(),
      setId: set.id,
      version: set.version,
      questionCount: set.questions.length,
      currentIndex: 0,
      answers: [],
      startedAt: new Date().toISOString(),
    });
    setSelected(null);
    setPhase("playing");
    if (forceNew) router.replace(`/quiz/${set.id}`); // 再読み込みで再び新規開始しないように
  }

  useEffect(() => {
    const existing = loadProgress(set.id);
    if (existing && !forceNew) {
      setSaved(existing);
      setPhase("choose");
    } else {
      startNew();
    }
    // 初回表示時に1回だけ判定する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "checking") return <LoadingScreen message="クイズを準備中…" />;

  if (phase === "choose" && saved) {
    const outdated = saved.version !== set.version;
    return (
      <div className="card mx-auto max-w-md animate-pop-in p-6 text-center">
        <div className="text-5xl">⏸️</div>
        <h1 className="mt-2 text-xl font-extrabold">{set.title}</h1>
        {outdated ? (
          <>
            <p className="mt-3 text-sm font-bold text-ink-soft">
              問題が更新されたため、途中のクイズは再開できません。最初から挑戦してください。
            </p>
            <button className="btn-pop pop-pink mt-5 w-full" onClick={startNew}>
              ▶ 最初から挑戦する
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 font-bold">
              途中のクイズがあります（{saved.answers.length}/{saved.questionCount}問 回答済み）
            </p>
            <div className="mt-5 space-y-3">
              <button
                className="btn-pop pop-yellow w-full text-lg"
                onClick={() => {
                  setP(saved);
                  setPhase("playing");
                }}
              >
                ▶ 続きから再開
              </button>
              <button className="btn-pop pop-white w-full" onClick={startNew}>
                ↺ 最初からやり直す
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-soft">やり直した場合、途中の分は平均正答率に含まれません（完了済みの記録は消えません）</p>
          </>
        )}
        <Link href={`/subjects/${set.subjectId}`} className="mt-4 inline-block text-sm font-bold text-ink-soft">
          ◀ もどる
        </Link>
      </div>
    );
  }

  if (!p) return null;
  const idx = p.currentIndex;
  const q = set.questions[idx];
  const mine = p.answers.find((a) => a.index === idx);
  const reveal = mine ? { answer: mine.answer, correctAnswer: q.answer } : null;
  const correctCount = p.answers.filter((a) => a.isCorrect).length;
  const isLast = idx >= p.questionCount - 1;
  const type = TYPE_LABEL[q.type];
  const qView = { type: q.type, prompt: q.prompt, options: q.type === "truefalse" ? null : q.options, image: q.image ?? null, blanks: q.type === "fill" ? q.blanks ?? null : null };

  function submit() {
    if (!p || selected === null || mine) return; // 確定後は変更できない
    const isCorrect = gradeAnswer(q, selected);
    if (isCorrect === null) return;
    const next = addAnswer(p, { index: idx, answer: selected, isCorrect });
    if (next === p) return; // 二重タップなど
    persist(next);
    recordDailyAnswer(isCorrect); // 日ごとの学習記録（グラフ用）
  }

  /** わからないときは答えを見る（不正解として記録） */
  function giveUp() {
    if (!p || mine) return;
    const next = addAnswer(p, { index: idx, answer: SKIP_ANSWER, isCorrect: false });
    if (next === p) return;
    persist(next);
    recordDailyAnswer(false);
  }

  function goNext() {
    if (!p || !mine || finishing.current) return;
    if (isLast) {
      finishing.current = true;
      const attempt = completeAndSave(p);
      router.replace(`/quiz/${set.id}/result/${attempt.id}`);
      return;
    }
    persist({ ...p, currentIndex: idx + 1 });
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/subjects/${set.subjectId}`}
          className="shrink-0 whitespace-nowrap text-sm font-bold text-ink-soft"
          aria-label="中断して一覧へ（続きから再開できます）"
        >
          ✕ 中断
        </Link>
        <p className="min-w-0 truncate text-right text-xs font-bold text-ink-soft">
          {subjectName}｜{set.title}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-candy-purple px-4 py-1 text-lg font-extrabold text-white">
          Q {idx + 1}
          <span className="text-sm opacity-80"> / {p.questionCount}</span>
        </span>
        <span className="rounded-full bg-candy-yellow-soft px-4 py-1 font-extrabold text-candy-yellow-deep" aria-label={`現在の正解数 ${correctCount}`}>
          ⭐ 正解 {correctCount}
        </span>
      </div>
      <ProgressBar value={p.answers.length} max={p.questionCount} label="回答した問題数" />

      <section key={idx} className="card relative animate-pop-in p-5">
        <span className={`mb-3 inline-block rounded-full px-3 py-0.5 text-xs font-extrabold ${type.cls}`}>{type.text}</span>
        <QuestionBody q={qView} selected={selected} reveal={reveal} onSelect={reveal ? undefined : setSelected} />
      </section>

      {!mine ? (
        <div className="space-y-2">
          <button className="btn-pop pop-pink w-full text-lg" disabled={selected === null} onClick={submit}>
            {selected === null ? "答えを選んでね" : "これで回答する！"}
          </button>
          <button
            type="button"
            onClick={giveUp}
            className="w-full rounded-2xl border-2 border-dashed border-[#d9cff2] bg-white/70 py-3 text-sm font-extrabold text-ink-soft active:scale-[0.98]"
          >
            🤔 わからない…答えを見る（不正解になります）
          </button>
        </div>
      ) : (
        <section
          className={`card relative overflow-hidden p-5 ${mine.isCorrect ? "animate-pop-in border-candy-mint bg-candy-mint-soft/50" : "animate-wiggle border-oops/50 bg-oops-soft"}`}
          aria-live="polite"
        >
          {mine.isCorrect && <StarBurst />}
          <p className={`relative text-2xl font-extrabold ${mine.isCorrect ? "text-candy-mint-deep" : "text-oops-deep"}`}>
            {mine.isCorrect ? `⭕ ${PRAISE[idx % PRAISE.length]}` : `🌱 ${CHEER[idx % CHEER.length]}`}
          </p>
          {mine.answer === SKIP_ANSWER && <p className="relative mt-1 text-sm font-bold text-ink-soft">答えを見たので、この問題は不正解として記録したよ。次はいける！</p>}
          {!mine.isCorrect && (
            <p className="relative mt-2 font-bold">
              正解は <span className="rounded-lg bg-white px-2 py-0.5 text-candy-mint-deep">{answerLabel(qView, q.answer)}</span>
            </p>
          )}
          <div className="relative mt-4 rounded-2xl bg-white p-4">
            <p className="text-sm font-extrabold text-candy-purple-deep">💡 解説</p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed"><RichText text={q.explanation} /></p>
            {q.sourcePage && <p className="mt-2 text-xs font-bold text-ink-soft">📄 授業資料：{q.sourcePage}</p>}
          </div>
          <button className={`btn-pop ${isLast ? "pop-purple" : "pop-sky"} relative mt-4 w-full text-lg`} onClick={goNext}>
            {isLast ? "🏆 結果を見る" : "次の問題へ ▶"}
          </button>
        </section>
      )}

      {storageWarning && (
        <p role="alert" className="rounded-2xl bg-oops-soft px-4 py-2 text-center text-xs font-bold text-oops-deep">
          この端末では記録を保存できませんでした（プライベートブラウズなど）。クイズは続けられますが、記録は残りません。
        </p>
      )}
    </div>
  );
}
