// 日付の表示（端末のタイムゾーンで表示）
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

function midnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 「11月19日（木）」＋「今日／昨日／3日前」。年が違えば年も付ける */
export function formatLastDate(iso: string, now: Date = new Date()): { date: string; relative: string } {
  const d = new Date(iso);
  const year = d.getFullYear() !== now.getFullYear() ? `${d.getFullYear()}年` : "";
  const date = `${year}${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`;
  const diff = Math.round((midnight(now) - midnight(d)) / 86_400_000); // 夏時間でもずれないよう丸める
  const relative = diff <= 0 ? "今日" : diff === 1 ? "昨日" : `${diff}日前`;
  return { date, relative };
}
