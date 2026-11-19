// 委員長のセリフ（結果や時間帯に合わせて選ぶ）

export type Mood = "proud" | "ok" | "worried" | "sleepy";

/** 同じ挑戦なら毎回同じセリフになるよう、文字列から番号を作る */
function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

const RESULT: { min: number; mood: Mood; lines: string[] }[] = [
  {
    min: 100,
    mood: "proud",
    lines: [
      "満点。委員会はキミの再試回避を正式に承認する。",
      "全問正解。もはや再試のほうがキミを避けている。",
      "完璧だ。本日の議事録に太字で記録しておく。",
    ],
  },
  {
    min: 80,
    mood: "proud",
    lines: [
      "再試回避率、高め。油断は禁物だが悪くない。",
      "合格圏内と判断する。委員会、満場一致で拍手。",
      "よろしい。この調子なら再試は他人事だ。",
    ],
  },
  {
    min: 60,
    mood: "ok",
    lines: [
      "ぎりぎり回避圏。委員会は経過観察とする。",
      "悪くはない。だが再試の気配がまだ少しする。",
      "あと一押し。まとめを読めば回避率は上がる。",
    ],
  },
  {
    min: 0,
    mood: "worried",
    lines: [
      "…再試の足音が聞こえる。まとめを読むのだ。",
      "委員会より緊急通達：復習を強く推奨する。",
      "大丈夫。ここで間違えた分は本番で取り返せる。もう一回だ。",
    ],
  },
];

/** 結果画面のひとこと（percent：今回の正答率） */
export function resultComment(percent: number, seed: string): { mood: Mood; line: string } {
  const tier = RESULT.find((t) => percent >= t.min)!;
  return { mood: tier.mood, line: pick(tier.lines, seed) };
}

/** ホームのあいさつ（時間帯と連続日数で変わる） */
export function greeting(now: Date, streakDays: number): { mood: Mood; line: string } {
  const h = now.getHours();
  const seed = now.toDateString();
  if (h < 5) return { mood: "sleepy", line: pick(["こんな時間まで…感心するが、睡眠も議題に入れたまえ。", "深夜の勉強会か。1セットだけやって寝ること。委員長命令だ。"], seed) };
  if (streakDays >= 3) return { mood: "proud", line: `🔥${streakDays}日連続とは見事だ。委員会はキミを模範委員に推薦する。` };
  if (h < 11) return { mood: "ok", line: pick(["おはよう。朝の1セットは再試回避に効く（委員会調べ）。", "本日の会議を始める。議題：再試を回避せよ。"], seed) };
  if (h < 18) return { mood: "ok", line: pick(["すきま時間に1セット。それが委員会の流儀だ。", "再試は待ってくれない。だが委員会は待っている。"], seed) };
  return { mood: "ok", line: pick(["夜の部へようこそ。まとめを読んでからクイズへ進みたまえ。", "今日の締めに1セット、どうだね。"], seed) };
}

