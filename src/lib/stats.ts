// 正答率の計算と表示（純粋関数・テスト済み）
//   平均正答率は「累計正解数 / 累計出題数」の整数のまま保存し、表示するときだけ丸めます。

/** 正答率 a と b を厳密に比較（a > b なら 1, 等しければ 0, a < b なら -1） */
export function compareRates(aCorrect: number, aTotal: number, bCorrect: number, bTotal: number): -1 | 0 | 1 {
  const lhs = BigInt(aCorrect) * BigInt(bTotal);
  const rhs = BigInt(bCorrect) * BigInt(aTotal);
  return lhs > rhs ? 1 : lhs < rhs ? -1 : 0;
}

/** 正答率を小数第1位までの文字列にする（四捨五入） */
export function formatPercent(correct: number, total: number): string {
  if (total <= 0) return "0.0";
  const c = BigInt(correct);
  const q = BigInt(total);
  const tenths = (2000n * c + q) / (2n * q); // round(1000*c/q)
  return `${tenths / 10n}.${tenths % 10n}`;
}

/** 平均正答率の差（新 − 旧, ポイント）を小数第1位の符号付き文字列で返す */
export function formatDelta(prevCorrect: number, prevTotal: number, nextCorrect: number, nextTotal: number): string {
  const num = (BigInt(nextCorrect) * BigInt(prevTotal) - BigInt(prevCorrect) * BigInt(nextTotal)) * 1000n;
  const den = BigInt(prevTotal) * BigInt(nextTotal);
  const neg = num < 0n;
  const abs = neg ? -num : num;
  const tenths = (2n * abs + den) / (2n * den);
  if (tenths === 0n) return "±0.0";
  return `${neg ? "−" : "+"}${tenths / 10n}.${tenths % 10n}`;
}
