"use client";
// 化合物いちらん：化合物群・生合成経路・種類・年度で絞り込める表
import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { Compound, CompoundFile, CompoundKind } from "@/lib/compound-types";
import { RichText } from "@/components/RichText";

const KINDS: { id: CompoundKind | "all"; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "antibiotic", label: "🦠 抗生物質" },
  { id: "drug", label: "💊 抗生物質以外の薬" },
  { id: "natural", label: "🌿 そのほかの天然物" },
];

const NO_PATH = "未確定・なし";

/** 経路ごとの色（短い表示名つき） */
function pathStyle(path: string): { short: string; cls: string } {
  if (!path) return { short: "—", cls: "bg-gray-100 text-ink-soft" };
  if (path.startsWith("イソプレノイド経路＋")) return { short: "イソプレノイド＋酢酸－マロン酸", cls: "bg-candy-purple-soft text-candy-purple-deep" };
  if (path.startsWith("イソプレノイド")) return { short: "イソプレノイド", cls: "bg-candy-purple-soft text-candy-purple-deep" };
  if (path.startsWith("シキミ酸経路＋")) return { short: "シキミ酸＋酢酸－マロン酸", cls: "bg-candy-yellow-soft text-candy-yellow-deep" };
  if (path.startsWith("シキミ酸")) return { short: "シキミ酸", cls: "bg-candy-mint-soft text-candy-mint-deep" };
  return { short: "酢酸－マロン酸", cls: "bg-candy-sky-soft text-candy-sky-deep" };
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold ${on ? "border-candy-purple bg-candy-purple text-white" : "border-[#ece6f8] bg-white text-ink"}`}
    >
      {children}
    </button>
  );
}

export function CompoundTable({ subject, file }: { subject: { id: string; name: string }; file: CompoundFile }) {
  const all = file.compounds;
  const [kind, setKind] = useState<CompoundKind | "all">("all");
  const [group, setGroup] = useState<string>("all");
  const [path, setPath] = useState<string>("all");
  const [year, setYear] = useState<number | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const g = Array.from(new Set(all.map((c) => c.group))).filter((x) => x !== "その他");
    return [...g.sort((a, b) => a.localeCompare(b, "ja")), "その他"];
  }, [all]);
  const paths = useMemo(() => {
    const p = Array.from(new Set(all.map((c) => pathStyle(c.path).short))).filter((x) => x !== "—");
    return [...p, NO_PATH];
  }, [all]);
  const years = useMemo(() => Array.from(new Set(all.flatMap((c) => c.years))).sort(), [all]);

  const shown = all.filter((c: Compound) => {
    if (kind !== "all" && c.kind !== kind) return false;
    if (group !== "all" && c.group !== group) return false;
    if (path !== "all") {
      const s = pathStyle(c.path).short;
      if (path === NO_PATH ? s !== "—" : s !== path) return false;
    }
    if (year !== "all" && !c.years.includes(year)) return false;
    const t = q.trim();
    if (t && ![c.name, c.cls, c.use, c.base, c.origin, c.path].some((x) => x.includes(t))) return false;
    return true;
  });

  function reset() {
    setKind("all"); setGroup("all"); setPath("all"); setYear("all"); setQ("");
  }
  const filtered = kind !== "all" || group !== "all" || path !== "all" || year !== "all" || q.trim() !== "";

  return (
    <div className="space-y-4">
      <Link href={`/subjects/${subject.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
        ◀ {subject.name}
      </Link>
      <header className="card p-5">
        <h1 className="text-2xl font-extrabold">🧾 化合物いちらん</h1>
        <p className="mt-1 text-sm text-ink-soft">
          試験に出た化合物を、化合物群・生合成経路・何の薬かで一覧にしました。行をタップすると「分類の見分け方」が開きます。
        </p>
        <p className="mt-1 text-xs font-bold text-ink-soft">📄 {file.note}。空欄は資料に書かれていない（または確定していない）ところです。</p>
      </header>

      <section className="card space-y-3 p-4">
        <input
          type="search"
          value={q}
          onChange={(e: { target: { value: string } }) => setQ(e.target.value)}
          placeholder="🔍 名前・用途などで検索（例：抗がん、放線菌）"
          className="w-full rounded-2xl border-2 border-[#ece6f8] bg-white px-4 py-2.5 text-base font-bold outline-none focus:border-candy-purple"
        />
        <div>
          <p className="mb-1 text-xs font-extrabold text-ink-soft">種類</p>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <Chip key={k.id} on={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-extrabold text-ink-soft">化合物群</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={group === "all"} onClick={() => setGroup("all")}>すべて</Chip>
            {groups.map((g) => (
              <Chip key={g} on={group === g} onClick={() => setGroup(g)}>{g}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-extrabold text-ink-soft">生合成経路</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={path === "all"} onClick={() => setPath("all")}>すべて</Chip>
            {paths.map((p) => (
              <Chip key={p} on={path === p} onClick={() => setPath(p)}>{p}</Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-extrabold text-ink-soft">出た年度</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={year === "all"} onClick={() => setYear("all")}>すべて</Chip>
            {years.map((y) => (
              <Chip key={y} on={year === y} onClick={() => setYear(y)}>{y}年度</Chip>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-extrabold">{shown.length} / {all.length} 化合物</p>
        {filtered && (
          <button type="button" onClick={reset} className="text-sm font-bold text-candy-purple-deep">
            ✕ 絞り込みをリセット
          </button>
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-candy-purple-soft text-xs font-extrabold text-candy-purple-deep">
              <th className="sticky left-0 z-10 bg-candy-purple-soft px-3 py-2">化合物</th>
              <th className="px-3 py-2">化合物群</th>
              <th className="px-3 py-2">生合成経路</th>
              <th className="px-3 py-2">何の薬・はたらき</th>
              <th className="px-3 py-2">もとになる物質・由来</th>
              <th className="px-3 py-2">年度</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => {
              const ps = pathStyle(c.path);
              const isOpen = open === c.name;
              return (
                <Fragment key={c.name}>
                  <tr
                    className={`cursor-pointer border-t border-[#f1ecfb] align-top ${isOpen ? "bg-candy-yellow-soft/40" : ""}`}
                    onClick={() => setOpen(isOpen ? null : c.name)}
                    aria-expanded={isOpen}
                  >
                    <th scope="row" className={`sticky left-0 z-10 w-[9.5em] max-w-[9.5em] px-3 py-2 font-extrabold ${isOpen ? "bg-[#fffbe6]" : "bg-white"}`}>
                      <span className="block">{c.name}</span>
                      {c.kind === "antibiotic" && <span className="mt-0.5 inline-block rounded bg-candy-pink-soft px-1 text-[10px] text-candy-pink-deep">抗生物質</span>}
                      {c.kind === "drug" && <span className="mt-0.5 inline-block rounded bg-candy-sky-soft px-1 text-[10px] text-candy-sky-deep">薬</span>}
                    </th>
                    <td className="w-[9em] max-w-[9em] px-3 py-2">{c.cls}</td>
                    <td className="px-3 py-2">
                      {c.path && <span className={`inline-block whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-extrabold ${ps.cls}`}>{ps.short}</span>}
                    </td>
                    <td className="w-[14em] max-w-[14em] px-3 py-2">{c.use}</td>
                    <td className="w-[12em] max-w-[12em] px-3 py-2">
                      {c.base && <span className="block font-bold">⬅️ {c.base}</span>}
                      {c.origin && <span className="block text-ink-soft">{c.origin}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-ink-soft">{c.years.map((y) => `${y % 100}`).join("・")}</td>
                  </tr>
                  {isOpen && c.why && (
                    <tr className="bg-[#fffbe6]">
                      <td colSpan={6} className="px-3 pb-3">
                        <div className="sticky left-3 max-w-[calc(100vw-4rem)] rounded-2xl bg-white p-3 text-sm leading-relaxed sm:max-w-xl">
                          <p className="text-xs font-extrabold text-candy-yellow-deep">🔍 分類の見分け方</p>
                          <RichText text={c.why} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center font-bold text-ink-soft">当てはまる化合物がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-xs text-ink-soft">👉 表は横にスクロールできます（化合物名は左に固定）</p>
    </div>
  );
}
