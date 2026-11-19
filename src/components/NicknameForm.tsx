"use client";
import { useState, type FormEvent } from "react";
import { NICKNAME_MAX, nicknameLength, validateNickname } from "@/lib/nickname";
import { errorMessage } from "@/lib/api-client";

export function NicknameForm({
  initial = "",
  submitLabel,
  onSubmit,
}: {
  initial?: string;
  submitLabel: string;
  onSubmit: (nickname: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const len = nicknameLength(value);

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const r = validateNickname(value);
    if (!r.ok) return setError(r.error);
    setBusy(true);
    setError(null);
    try {
      await onSubmit(r.value);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handle} className="mt-4 space-y-3" noValidate>
      <label className="block">
        <span className="sr-only">ニックネーム</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={NICKNAME_MAX * 2}
          autoComplete="nickname"
          enterKeyHint="done"
          placeholder="例：やくがくたろう"
          className="w-full rounded-2xl border-2 border-candy-purple-soft bg-white px-4 py-3 font-bold outline-none focus:border-candy-purple"
          aria-invalid={!!error}
          aria-describedby="nickname-help"
        />
      </label>
      <div id="nickname-help" className="flex justify-between text-xs">
        <span className="font-bold text-oops-deep">{error}</span>
        <span className={len > NICKNAME_MAX ? "font-bold text-oops-deep" : "text-ink-soft"}>
          {len} / {NICKNAME_MAX}
        </span>
      </div>
      <button type="submit" disabled={busy || len === 0} className="btn-pop pop-pink w-full text-lg">
        {busy ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
