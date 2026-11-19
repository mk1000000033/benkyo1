import Link from "next/link";
import type { SubjectColor } from "@content/subjects";
import { COLOR } from "@/lib/colors";
import { HomeGreeting } from "@/components/HomeGreeting";

interface SubjectItem {
  id: string;
  name: string;
  emoji: string;
  color: SubjectColor;
  isSample: boolean;
  setCount: number;
}

export function HomeView({ subjects }: { subjects: SubjectItem[] }) {
  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6">
        <div aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-candy-yellow-soft" />
        <div aria-hidden className="absolute -bottom-8 right-16 h-20 w-20 rounded-full bg-candy-sky-soft" />
        <p className="relative text-4xl" aria-hidden>🛡️💊📚</p>
        <h1 className="relative mt-2 text-[1.7rem] font-extrabold leading-tight">
          再試<span className="text-candy-pink">回避</span>
          <span className="text-candy-purple">委員会</span>
        </h1>
        <p className="relative mt-1 text-sm text-ink-soft">まとめを読んで、クイズを解いて、再試を回避しよう 🛡️ 何度でも挑戦して平均正答率を上げよう✨</p>
      </section>

      <HomeGreeting />

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden>📚</span>科目いちらん
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {subjects.map((s) => {
            const c = COLOR[s.color];
            const ready = s.setCount > 0;
            return (
              <li key={s.id} className={`card flex items-center gap-4 p-4 ${s.isSample ? "border-dashed" : ""}`}>
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-3xl ${c.soft}`} aria-hidden>
                  {s.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-extrabold">{s.name}</p>
                  <p className={`text-sm font-bold ${ready ? c.text : "text-ink-soft"}`}>
                    {ready ? `問題セット ${s.setCount}個` : "準備中…"}
                  </p>
                  {s.isSample && <p className="text-xs text-ink-soft">動作確認用（本番の問題ではありません）</p>}
                </div>
                {ready ? (
                  <Link href={`/subjects/${s.id}`} className={`btn-pop ${c.pop} shrink-0 px-4 text-sm`}>
                    えらぶ ▶
                  </Link>
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-2 text-xs font-bold text-ink-soft">近日公開</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-center text-xs text-ink-soft">
        📱 学習記録はこの端末のブラウザに保存されます（機種変更やSafariのデータ消去で消えます）
      </p>
    </div>
  );
}
