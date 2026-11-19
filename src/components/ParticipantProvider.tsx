"use client";
// 参加者（匿名認証＋ニックネーム）の管理。準備ができるまで子要素を表示しない。
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { getAccessToken, getUserId } from "@/lib/supabase-browser";
import { NICKNAME_STORAGE_KEY } from "@/lib/nickname";
import type { ParticipantDTO } from "@/lib/api-types";
import { ErrorBox, LoadingScreen } from "./ui";
import { NicknameForm } from "./NicknameForm";

interface ParticipantContextValue {
  userId: string;
  nickname: string;
  updateNickname: (nickname: string) => Promise<void>;
}

const Ctx = createContext<ParticipantContextValue | null>(null);

export function useParticipant(): ParticipantContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useParticipant は ParticipantProvider の内側で使ってください");
  return v;
}

function readLocalNickname(): string | null {
  try {
    return localStorage.getItem(NICKNAME_STORAGE_KEY);
  } catch {
    return null;
  }
}
function writeLocalNickname(n: string) {
  try {
    localStorage.setItem(NICKNAME_STORAGE_KEY, n);
  } catch {
    /* noop */
  }
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "needsNickname"; userId: string }
  | { kind: "ready"; userId: string; nickname: string };

export function ParticipantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const register = useCallback(async (nickname: string) => {
    const { participant } = await api<{ participant: ParticipantDTO }>("/api/participant", {
      method: "POST",
      body: { nickname },
    });
    writeLocalNickname(participant.nickname);
    setState({ kind: "ready", userId: participant.id, nickname: participant.nickname });
  }, []);

  const init = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      await getAccessToken(); // 初回は匿名ログイン
      const userId = (await getUserId()) ?? "";
      const { participant } = await api<{ participant: ParticipantDTO | null }>("/api/participant");
      if (participant) {
        writeLocalNickname(participant.nickname);
        setState({ kind: "ready", userId: participant.id, nickname: participant.nickname });
        return;
      }
      // サーバーに未登録：端末に保存済みのニックネームがあればそれで登録、なければ入力画面へ
      const local = readLocalNickname();
      if (local) {
        try {
          await register(local);
          return;
        } catch {
          /* 保存値が不正なら入力画面へ */
        }
      }
      setState({ kind: "needsNickname", userId });
    } catch (e) {
      setState({ kind: "error", message: errorMessage(e) });
    }
  }, [register]);

  useEffect(() => {
    void init();
  }, [init]);

  if (state.kind === "loading") return <LoadingScreen message="じゅんび中…" />;
  if (state.kind === "error") return <ErrorBox message={state.message} onRetry={() => void init()} />;
  if (state.kind === "needsNickname") {
    return (
      <div className="mx-auto max-w-md px-4 pt-10">
        <div className="text-center">
          <div className="text-5xl">💊🧪⭐</div>
          <h1 className="mt-3 text-2xl font-extrabold">
            みんなの<span className="text-candy-pink">薬学</span>クイズ
          </h1>
          <p className="mt-2 text-sm text-ink-soft">友達と平均正答率を競いながら、楽しく試験対策！</p>
        </div>
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-extrabold">ニックネームを決めよう</h2>
          <p className="mt-1 text-sm text-ink-soft">ランキングに表示されます。登録やパスワードは不要です。</p>
          <NicknameForm submitLabel="はじめる！" onSubmit={register} />
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider
      value={{
        userId: state.userId,
        nickname: state.nickname,
        updateNickname: register,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

/** テスト・プレビュー用 */
export { Ctx as ParticipantContext };
