// 日ごとの学習記録（解いた問題数・正解数）
//   回答を確定するたびに、その日（端末の日付）の数を1つ増やします。
//   この機能より前の記録は、保存済みの完了した挑戦から1回だけ補完します。
import type { SetRecord } from "./records";

export interface DayStat {
  answered: number;
  correct: number;
}

/** "YYYY-MM-DD" → 記録 */
export type DailyLog = Record<string, DayStat>;

export interface DayPoint {
  date: string;
  answered: number;
  correct: number;
  /** 正答率（%）。解いていない日は null */
  rate: number | null;
}

/** 端末のタイムゾーンでの日付キー */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addToLog(log: DailyLog, key: string, isCorrect: boolean): DailyLog {
  const cur = log[key] ?? { answered: 0, correct: 0 };
  return { ...log, [key]: { answered: cur.answered + 1, correct: cur.correct + (isCorrect ? 1 : 0) } };
}

/** 保存済みの完了した挑戦から、日ごとの記録を作る（初回だけ使う） */
export function logFromRecords(records: SetRecord[]): DailyLog {
  let log: DailyLog = {};
  for (const r of records) {
    for (const a of r.attempts) {
      const key = dateKey(new Date(a.completedAt));
      for (const ans of a.answers) log = addToLog(log, key, ans.isCorrect);
    }
  }
  return log;
}

/** end を最終日とする days 日分の並び（解いていない日も 0 で埋める） */
export function series(log: DailyLog, end: Date, days: number): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    const key = dateKey(d);
    const s = log[key] ?? { answered: 0, correct: 0 };
    out.push({ date: key, answered: s.answered, correct: s.correct, rate: s.answered ? (s.correct / s.answered) * 100 : null });
  }
  return out;
}

/** 今日（または昨日）までさかのぼって、毎日続けて解いた日数 */
export function streak(log: DailyLog, today: Date): number {
  let n = 0;
  let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // 今日まだ解いていなくても、昨日まで続いていれば連続中とみなす
  if (!log[dateKey(d)]?.answered) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  while (log[dateKey(d)]?.answered) {
    n++;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  }
  return n;
}

export function totals(points: DayPoint[]) {
  const answered = points.reduce((s, p) => s + p.answered, 0);
  const correct = points.reduce((s, p) => s + p.correct, 0);
  const activeDays = points.filter((p) => p.answered > 0).length;
  return { answered, correct, activeDays };
}

/** "2026-11-19" → "11/19" */
export function shortDate(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  return `${m}/${d}`;
}

// ---------------- ブラウザ保存 ----------------
const KEY = "yq:v1:daily";
const RECORD_PREFIX = "yq:v1:record:";

/** 日ごとの記録を読む。まだなければ、これまでの挑戦から補完して保存する */
export function loadDailyLog(): DailyLog {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DailyLog;
    const records: SetRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(RECORD_PREFIX)) {
        const r = JSON.parse(localStorage.getItem(k) ?? "null") as SetRecord | null;
        if (r?.attempts) records.push(r);
      }
    }
    const log = logFromRecords(records);
    localStorage.setItem(KEY, JSON.stringify(log));
    return log;
  } catch {
    return {};
  }
}

/** 1問の回答を、今日の記録に加える */
export function recordDailyAnswer(isCorrect: boolean, now: Date = new Date()): void {
  try {
    const log = addToLog(loadDailyLog(), dateKey(now), isCorrect);
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    /* 保存できない環境では記録しない */
  }
}
