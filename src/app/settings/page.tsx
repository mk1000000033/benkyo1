"use client";
import Link from "next/link";
import { useState } from "react";
import { useParticipant } from "@/components/ParticipantProvider";
import { NicknameForm } from "@/components/NicknameForm";

export default function SettingsPage() {
  const { nickname, userId, updateNickname } = useParticipant();
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
        ◀ ホーム
      </Link>
      <h1 className="text-2xl font-extrabold">⚙︎ 設定</h1>

      <section className="card p-5">
        <h2 className="font-extrabold">ニックネームの変更</h2>
        <p className="mt-1 text-sm text-ink-soft">変更すると、すべてのランキングの表示名が新しい名前になります。他の人と同じ名前でもOKです。</p>
        <NicknameForm
          key={nickname}
          initial={nickname}
          submitLabel="保存する"
          onSubmit={async (n) => {
            await updateNickname(n);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
        />
        {saved && <p className="mt-2 animate-pop-in text-center font-bold text-candy-mint-deep">✓ 保存しました</p>}
      </section>

      <section className="card space-y-2 p-5 text-sm">
        <h2 className="font-extrabold">記録の保存について</h2>
        <p>
          このアプリはアカウント登録なしで使えるよう、<b>この端末・このブラウザ</b>ごとに参加者を識別しています。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-ink-soft">
          <li>機種変更・別のブラウザ・Safariの「履歴とWebサイトデータを消去」を行うと、新しい参加者として扱われ、これまでの記録は引き継げません。</li>
          <li>プライベートブラウズでは記録が残らない場合があります。</li>
          <li>ホーム画面に追加した場合も、Safariとは別の参加者として扱われることがあります。</li>
        </ul>
        <p className="pt-2 text-xs text-ink-soft">
          参加者ID：<code className="break-all">{userId}</code>
        </p>
      </section>
    </div>
  );
}
