// 日ごとの「解いた問題数（棒）」と「正答率（折れ線）」のグラフ（SVG）
import { shortDate, type DayPoint } from "@/lib/daily";

const W = 340;
const H = 220;
const PAD = { l: 30, r: 34, t: 14, b: 28 };
const PINK = "#ff6fae";
const SKY = "#4cb8ff";
const INK_SOFT = "#7a7392";
const GRID = "#efeaf8";

/** 目盛りがきりのいい数になる最大値 */
export function niceMax(n: number): number {
  if (n <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= n) return m * pow;
  return 10 * pow;
}

export function StudyChart({ points }: { points: DayPoint[] }) {
  const max = niceMax(Math.max(...points.map((p) => p.answered), 1));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const step = iw / points.length;
  const bw = Math.max(3, Math.min(22, step * 0.6));
  const x = (i: number) => PAD.l + step * i + step / 2;
  const yCount = (v: number) => PAD.t + ih - (v / max) * ih;
  const yRate = (v: number) => PAD.t + ih - (v / 100) * ih;
  const labelEvery = points.length <= 7 ? 1 : points.length <= 14 ? 2 : 5;

  // 正答率の線（解いていない日はとばしてつなぐ）
  const ratePts = points.map((p, i) => (p.rate === null ? null : `${x(i)},${yRate(p.rate)}`)).filter(Boolean);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="日ごとの解いた問題数と正答率のグラフ">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih * (1 - f)} y2={PAD.t + ih * (1 - f)} stroke={GRID} strokeWidth={1} />
          <text x={PAD.l - 5} y={PAD.t + ih * (1 - f) + 3} fontSize={9} textAnchor="end" fill={SKY} fontWeight={700}>
            {Math.round(max * f)}
          </text>
          <text x={W - PAD.r + 5} y={PAD.t + ih * (1 - f) + 3} fontSize={9} fill={PINK} fontWeight={700}>
            {f * 100}%
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <g key={p.date}>
          {p.answered > 0 && (
            <rect x={x(i) - bw / 2} y={yCount(p.answered)} width={bw} height={PAD.t + ih - yCount(p.answered)} rx={Math.min(5, bw / 2)} fill={SKY} opacity={0.85} />
          )}
          {i % labelEvery === (points.length - 1) % labelEvery && (
            <text x={x(i)} y={H - 10} fontSize={9} textAnchor="middle" fill={INK_SOFT} fontWeight={700}>
              {shortDate(p.date)}
            </text>
          )}
        </g>
      ))}
      {ratePts.length > 1 && <polyline points={ratePts.join(" ")} fill="none" stroke={PINK} strokeWidth={2.5} strokeLinejoin="round" />}
      {points.map((p, i) =>
        p.rate === null ? null : <circle key={`c${p.date}`} cx={x(i)} cy={yRate(p.rate)} r={3.5} fill="#fff" stroke={PINK} strokeWidth={2} />,
      )}
    </svg>
  );
}
