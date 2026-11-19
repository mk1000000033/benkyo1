"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerValue, QuizSetSummary } from "@/lib/quiz-types";
import type { AnswerResultDTO, AttemptStateDTO, InProgressDTO } from "@/lib/api-types";
import { ApiError, api, errorMessage } from "@/lib/api-client";
import { clearLocalProgress, loadLocalProgress, saveLocalProgress } from "@/lib/local-progress";
import { ErrorBox, LoadingScreen, ProgressBar, StarBurst } from "@/components/ui";
import { QuestionBody, TYPE_LABEL, answerLabel } from "@/components/QuestionBody";

type Phase = "checking" | "choose" | "starting" | "playing" | "completing" | "error";

const PRAISE = ["せいかい！すごい！", "ナイス！その調子✨", "かんぺき！", "やったね！正解！", "さすが！🎉"];
const CHEER = [
  "おしい！解説でしっかり確認しよう",
  "ドンマイ！ここで覚えれば本番はバッチリ",
  "惜しい！次はきっと正解できるよ",
  "大丈夫！まちがえた問題こそ伸びしろ🌱",
];

export function QuizPlayer({ set, subjectName, forceNew }: { set: QuizSetSummary; subjectName: string; forceNew: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState<InProgressDTO | null>(null);
  const [st, setSt] = useState<AttemptStateDTO | null>(null);
  const [selected, setSelected] = useState<AnswerValue | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const initRef = useRef(false);

  const persist = useCallback((s: AttemptStateDTO) => {
    saveLocalProgress({
      setId: s.setId,
      version: s.version,
      attemptId: s.attemptId,
      currentIndex: s.currentIndex,
      correctCount: s.correctCount,
      revealed: s.revealed,
      showingExplanation: !!s.revealed[s.currentIndex],
      savedAt: new Date().toISOString(),
    });
  }, []);

  const start = useCallback(
    async (mode: "resume" | "new") => {
      setPhase("starting");
      setError(null);
      try {
        const s = await api<AttemptStateDTO>("/api/attempts", { method: "POST", body: { setId: set.id, mode } });
        setSt(s);
        setSelected(null);
        persist(s);
        setPhase("playing");
        if (forceNew) router.replace(`/quiz/${set.id}`); // 再読み込みで再び新規開始しないように
      } catch (e) {
        setError(errorMessage(e));
        setPhase("error");
      }
    },
    [set.id, persist, forceNew, router],
  );

  const check = useCallback(async () => {
    setPhase("checking");
    setError(null);
    try {
      const { inProgress } = await api<{ inProgress: InProgressDTO | null }>(`/api/attempts?setId=${encodeURIComponent(set.id)}`);
      // 端末の保存内容とサーバーを照合（サーバーを優先）
      const local = loadLocalProgress(set.id);
      if (local && (!inProgress || local.attemptId !== inProgress.attemptId)) clearLocalProgress(set.id);
      if (inProgress && !forceNew) {
        setPending(inProgress);
        setPhase("choose");
      } else {
        await start("new");
      }
    } catch (e) {
      setError(errorMessage(e));
      setPhase("error");
    }
  }, [set.id, forceNew, start]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void check();
  }, [check]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function resync() {
    try {
      const s = await api<AttemptStateDTO>("/api/attempts", { method: "POST", body: { setId: set.id, mode: "resume" } });
      setSt(s);
      setSelected(null);
      persist(s);
    } catch {
      /* 次の操作で再度エラー表示される */
    }
  }

  async function submit() {
    if (!st || selected === null || busyRef.current) return;
    const idx = st.currentIndex;
    if (st.revealed[idx]) return; // 確定済みは変更できない
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await api<AnswerResultDTO>(`/api/attempts/${st.attemptId}/answer`, {
        method: "POST",
        body: { index: idx, answer: selected },
      });
      const next: AttemptStateDTO = {
        ...st,
        correctCount: r.correctCount,
        revealed: {
          ...st.revealed,
          [idx]: { answer: r.answer, correctAnswer: r.correctAnswer, isCorrect: r.isCorrect, explanation: r.explanation, sourcePage: r.sourcePage },
        },
      };
      setSt(next);
      persist(next);
    } catch (e) {
      setToast(errorMessage(e));
      if (e instanceof ApiError && e.status === 409) await resync();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function goNext() {
    if (!st || busyRef.current) return;
    const idx = st.currentIndex;
    if (!st.revealed[idx]) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (idx >= st.questionCount - 1) {
        setPhase("completing");
        await api(`/api/attempts/${st.attemptId}/complete`, { method: "POST" });
        clearLocalProgress(set.id);
        router.replace(`/quiz/${set.id}/result/${st.attemptId}`);
        return;
      }
      await api(`/api/attempts/${st.attemptId}/advance`, { method: "POST", body: { toIndex: idx + 1 } });
      const next = { ...st, currentIndex: idx + 1 };
      setSt(next);
      setSelected(null);
      persist(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setPhase("playing");
      setToast(errorMessage(e));
      if (e instanceof ApiError && e.status === 409) await resync();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  // ---------- 表示 ----------
  if (phase === "checking" || phase === "starting") return <LoadingScreen message="クイズを準備中…" />;
  if (phase === "completing") return <LoadingScreen message="結果を集計中…🏆" />;
  if (phase === "error") return <ErrorBox message={error ?? "エラーが発生しました"} onRetry={() => void check()} />;

  if (phase === "choose" && pending) {
    return (
      <div className="card mx-auto max-w-md animate-pop-in p-6 text-center">
        <div className="text-5xl">⏸️</div>
        <h1 className="mt-2 text-xl font-extrabold">{set.title}</h1>
        {pending.outdated ? (
          <>
            <p className="mt-3 text-sm font-bold text-ink-soft">
              問題が更新されたため、途中のクイズは再開できません。最初から挑戦してください。
              <br />
              （途中の記録は平均正答率には含まれません）
            </p>
            <button className="btn-pop pop-pink mt-5 w-full" onClick={() => void start("new")}>
              ▶ 最初から挑戦する
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 font-bold">
              途中のクイズがあります（{pending.answeredCount}/{pending.questionCount}問 回答済み）
            </p>
            <div className="mt-5 space-y-3">
              <button className="btn-pop pop-yellow w-full text-lg" onClick={() => void start("resume")}>
                ▶ 続きから再開
              </button>
              <button className="btn-pop pop-white w-full" onClick={() => void start("new")}>
                ↺ 最初からやり直す
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-soft">やり直した場合、途中の記録は平均正答率に含まれません（完了済みの記録は消えません）</p>
          </>
        )}
        <Link href={`/subjects/${set.subjectId}`} className="mt-4 inline-block text-sm font-bold text-ink-soft">
          ◀ もどる
        </Link>
      </div>
    );
  }

  if (!st) return null;
  const idx = st.currentIndex;
  const q = st.questions[idx];
  const reveal = st.revealed[idx] ?? null;
  const answeredCount = Object.keys(st.revealed).length;
  const isLast = idx >= st.questionCount - 1;
  const type = TYPE_LABEL[q.type];
  const qView = { type: q.type, prompt: q.prompt, options: "options" in q ? q.options : null };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/subjects/${set.subjectId}`} className="shrink-0 whitespace-nowrap text-sm font-bold text-ink-soft" aria-label="中断して一覧へ（続きから再開できます）">
          ✕ 中断
        </Link>
        <p className="min-w-0 truncate text-right text-xs font-bold text-ink-soft">
          {subjectName}｜{set.title}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-candy-purple px-4 py-1 text-lg font-extrabold text-white">
          Q {idx + 1}
          <span className="text-sm opacity-80"> / {st.questionCount}</span>
        </span>
        <span className="rounded-full bg-candy-yellow-soft px-4 py-1 font-extrabold text-candy-yellow-deep" aria-label={`現在の正解数 ${st.correctCount}`}>
          ⭐ 正解 {st.correctCount}
        </span>
      </div>
      <ProgressBar value={answeredCount} max={st.questionCount} label="回答した問題数" />

      <section key={idx} className="card relative animate-pop-in p-5">
        <span className={`mb-3 inline-block rounded-full px-3 py-0.5 text-xs font-extrabold ${type.cls}`}>{type.text}</span>
        <QuestionBody q={qView} selected={selected} reveal={reveal} onSelect={reveal ? undefined : setSelected} />
      </section>

      {!reveal ? (
        <button className="btn-pop pop-pink w-full text-lg" disabled={selected === null || busy} onClick={() => void submit()}>
          {busy ? "採点中…" : selected === null ? "答えを選んでね" : "これで回答する！"}
        </button>
      ) : (
        <section
          className={`card relative overflow-hidden p-5 ${reveal.isCorrect ? "border-candy-mint bg-candy-mint-soft/50" : "border-oops/50 bg-oops-soft"} ${reveal.isCorrect ? "animate-pop-in" : "animate-wiggle"}`}
          aria-live="polite"
        >
          {reveal.isCorrect && <StarBurst />}
          <p className={`relative text-2xl font-extrabold ${reveal.isCorrect ? "text-candy-mint-deep" : "text-oops-deep"}`}>
            {reveal.isCorrect ? `⭕ ${PRAISE[idx % PRAISE.length]}` : `🌱 ${CHEER[idx % CHEER.length]}`}
          </p>
          {!reveal.isCorrect && (
            <p className="relative mt-2 font-bold">
              正解は <span className="rounded-lg bg-white px-2 py-0.5 text-candy-mint-deep">{answerLabel(qView, reveal.correctAnswer)}</span>
            </p>
          )}
          <div className="relative mt-4 rounded-2xl bg-white p-4">
            <p className="text-sm font-extrabold text-candy-purple-deep">💡 解説</p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{reveal.explanation}</p>
            {reveal.sourcePage && <p className="mt-2 text-xs font-bold text-ink-soft">📄 授業資料：{reveal.sourcePage}</p>}
          </div>
          <button className={`btn-pop ${isLast ? "pop-purple" : "pop-sky"} relative mt-4 w-full text-lg`} disabled={busy} onClick={() => void goNext()}>
            {busy ? "…" : isLast ? "🏆 結果を見る" : "次の問題へ ▶"}
          </button>
        </section>
      )}

      {toast && (
        <div role="alert" className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md animate-pop-in rounded-2xl bg-ink px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
