// ランキング計算（純粋関数・テスト済み）
//   平均正答率は「累計正解数 / 累計出題数」の分数のまま扱い、
//   比較は BigInt のクロス乗算で行うため、丸め誤差で順位が変わることはありません。

export interface RankRow {
  participantId: string;
  nickname: string;
  attemptsCount: number;
  totalCorrect: number;
  totalQuestions: number;
  /** 現在の平均正答率に初めて到達した日時（PostgreSQL の timestamptz 文字列） */
  reachedAt: string;
}

export interface RankedRow extends RankRow {
  rank: number;
}

/** timestamptz 文字列をマイクロ秒精度の BigInt に変換（JS の Date はミリ秒までなので自前で解析） */
export function toMicros(ts: string): bigint {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}(?::?\d{2})?)?$/.exec(ts.trim());
  if (!m) {
    const ms = Date.parse(ts);
    if (Number.isNaN(ms)) throw new Error(`invalid timestamp: ${ts}`);
    return BigInt(ms) * 1000n;
  }
  const [, date, time, frac = "", zoneRaw = "Z"] = m;
  let zone = zoneRaw;
  if (zone !== "Z") {
    const sign = zone[0];
    const digits = zone.slice(1).replace(":", "");
    zone = `${sign}${digits.slice(0, 2)}:${(digits.slice(2) || "00").padEnd(2, "0")}`;
  }
  const baseMs = Date.parse(`${date}T${time}${zone}`);
  if (Number.isNaN(baseMs)) throw new Error(`invalid timestamp: ${ts}`);
  const micros = BigInt((frac + "000000").slice(0, 6));
  return BigInt(baseMs) * 1000n + micros;
}

/** 平均正答率 a と b を厳密に比較（a > b なら 1, 等しければ 0, a < b なら -1） */
export function compareRates(aCorrect: number, aTotal: number, bCorrect: number, bTotal: number): -1 | 0 | 1 {
  const lhs = BigInt(aCorrect) * BigInt(bTotal);
  const rhs = BigInt(bCorrect) * BigInt(aTotal);
  return lhs > rhs ? 1 : lhs < rhs ? -1 : 0;
}

/** 並び順：平均正答率が高い → 先に到達した → 参加者ID */
export function compareRows(a: RankRow, b: RankRow): number {
  const byRate = compareRates(a.totalCorrect, a.totalQuestions, b.totalCorrect, b.totalQuestions);
  if (byRate !== 0) return -byRate;
  const ta = toMicros(a.reachedAt);
  const tb = toMicros(b.reachedAt);
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.participantId < b.participantId ? -1 : a.participantId > b.participantId ? 1 : 0;
}

/** 順位をつける（同点でも到達日時・IDで必ず順位が分かれる） */
export function rankRows(rows: RankRow[]): RankedRow[] {
  return [...rows].sort(compareRows).map((r, i) => ({ ...r, rank: i + 1 }));
}

/** 正答率を小数第1位までの文字列にする（四捨五入・表示専用） */
export function formatPercent(correct: number, total: number): string {
  if (total <= 0) return "0.0";
  const c = BigInt(correct);
  const q = BigInt(total);
  const tenths = (2000n * c + q) / (2n * q); // round(1000*c/q)
  return `${tenths / 10n}.${tenths % 10n}`;
}

/** 平均正答率の差（新 − 旧, ポイント）を小数第1位の符号付き文字列で返す */
export function formatDelta(prevCorrect: number, prevTotal: number, nextCorrect: number, nextTotal: number): string {
  // (next/nt - prev/pt) * 1000 を四捨五入（0から遠い方へ）
  const num = (BigInt(nextCorrect) * BigInt(prevTotal) - BigInt(prevCorrect) * BigInt(nextTotal)) * 1000n;
  const den = BigInt(prevTotal) * BigInt(nextTotal);
  const neg = num < 0n;
  const abs = neg ? -num : num;
  const tenths = (2n * abs + den) / (2n * den);
  const body = `${tenths / 10n}.${tenths % 10n}`;
  if (tenths === 0n) return "±0.0";
  return `${neg ? "−" : "+"}${body}`;
}
