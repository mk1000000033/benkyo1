"use client";
// シェア用の画像（1080×1350）を Canvas で描く
import { shortDate, type DayPoint } from "./daily";
import { niceMax } from "@/components/StudyChart";

const FONT = `"Hiragino Maru Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", "Meiryo", sans-serif`;
const INK = "#3a3350";
const INK_SOFT = "#7a7392";
const PINK = "#ff6fae";
const SKY = "#4cb8ff";
const PURPLE = "#9b7bff";
const GRID = "#efeaf8";

export interface ShareImageData {
  points: DayPoint[];
  periodLabel: string;
  answered: number;
  ratePercentText: string;
  activeDays: number;
  streak: number;
  footer: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShareImage(data: ShareImageData): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("画像を作れませんでした"));

  // 背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  for (const [cx, cy, r, color] of [
    [90, 80, 260, "rgba(255,111,174,0.16)"],
    [1010, 220, 280, "rgba(76,184,255,0.16)"],
    [980, 1290, 300, "rgba(63,214,164,0.16)"],
    [60, 1240, 240, "rgba(155,123,255,0.14)"],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // タイトル
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText("🛡️ 再試回避委員会", 80, 130);
  ctx.font = `800 76px ${FONT}`;
  ctx.fillText("📊 学習記録", 80, 230);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 36px ${FONT}`;
  ctx.fillText(data.periodLabel, 80, 290);

  // 数字のタイル
  const tiles = [
    { label: "解いた問題", value: `${data.answered}問`, color: SKY, bg: "#e1f3ff" },
    { label: "正答率", value: `${data.ratePercentText}%`, color: "#d63d82", bg: "#ffe4f0" },
    { label: "勉強した日", value: `${data.activeDays}日`, color: "#189a72", bg: "#dcfaef" },
    { label: "連続", value: `🔥${data.streak}日`, color: "#c48a00", bg: "#fff5d1" },
  ];
  const tw = (W - 160 - 3 * 24) / 4;
  tiles.forEach((t, i) => {
    const x = 80 + i * (tw + 24);
    ctx.fillStyle = t.bg;
    roundRect(ctx, x, 340, tw, 170, 32);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = INK_SOFT;
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(t.label, x + tw / 2, 395);
    ctx.fillStyle = t.color;
    ctx.font = `800 ${t.value.length > 6 ? 44 : 52}px ${FONT}`;
    ctx.fillText(t.value, x + tw / 2, 470);
    ctx.textAlign = "left";
  });

  // グラフのカード
  const cx0 = 60;
  const cy0 = 560;
  const cw = W - 120;
  const ch = 640;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(58,51,80,0.10)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, cx0, cy0, cw, ch, 48);
  ctx.fill();
  ctx.shadowColor = "transparent";

  // 凡例
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = SKY;
  roundRect(ctx, cx0 + 50, cy0 + 44, 36, 24, 8);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText("解いた問題数", cx0 + 98, cy0 + 66);
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx0 + 330, cy0 + 56);
  ctx.lineTo(cx0 + 380, cy0 + 56);
  ctx.stroke();
  ctx.fillText("正答率", cx0 + 392, cy0 + 66);

  // 軸と目盛り
  const pl = cx0 + 100;
  const pr = cx0 + cw - 110;
  const pt = cy0 + 120;
  const pb = cy0 + ch - 80;
  const iw = pr - pl;
  const ih = pb - pt;
  const pts = data.points;
  const max = niceMax(Math.max(...pts.map((p) => p.answered), 1));
  ctx.lineWidth = 2;
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = pb - ih * f;
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.moveTo(pl, y);
    ctx.lineTo(pr, y);
    ctx.stroke();
    ctx.font = `700 24px ${FONT}`;
    ctx.fillStyle = SKY;
    ctx.textAlign = "right";
    ctx.fillText(String(Math.round(max * f)), pl - 14, y + 8);
    ctx.fillStyle = PINK;
    ctx.textAlign = "left";
    ctx.fillText(`${f * 100}%`, pr + 14, y + 8);
  }

  const step = iw / pts.length;
  const bw = Math.max(8, Math.min(56, step * 0.6));
  const x = (i: number) => pl + step * i + step / 2;
  const labelEvery = pts.length <= 7 ? 1 : pts.length <= 14 ? 2 : 5;
  pts.forEach((p, i) => {
    if (p.answered > 0) {
      const y = pb - (p.answered / max) * ih;
      ctx.fillStyle = SKY;
      roundRect(ctx, x(i) - bw / 2, y, bw, pb - y, Math.min(12, bw / 2));
      ctx.fill();
    }
    if (i % labelEvery === (pts.length - 1) % labelEvery) {
      ctx.fillStyle = INK_SOFT;
      ctx.font = `700 24px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(shortDate(p.date), x(i), pb + 40);
      ctx.textAlign = "left";
    }
  });

  const ratePts = pts.map((p, i) => (p.rate === null ? null : [x(i), pb - (p.rate / 100) * ih])).filter((v): v is number[] => !!v);
  if (ratePts.length > 1) {
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ratePts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();
  }
  for (const [px, py] of ratePts) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // フッター
  ctx.fillStyle = PURPLE;
  ctx.font = `800 30px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(data.footer, W / 2, H - 70);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を作れませんでした"))), "image/png"),
  );
}
