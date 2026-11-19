import type { SubjectColor } from "@content/subjects";

// 科目の色ごとのクラス名（Tailwind が検出できるよう完全な文字列で書く）
export const COLOR: Record<SubjectColor, { pop: string; soft: string; text: string; ring: string }> = {
  pink: { pop: "pop-pink", soft: "bg-candy-pink-soft", text: "text-candy-pink-deep", ring: "border-candy-pink" },
  sky: { pop: "pop-sky", soft: "bg-candy-sky-soft", text: "text-candy-sky-deep", ring: "border-candy-sky" },
  purple: { pop: "pop-purple", soft: "bg-candy-purple-soft", text: "text-candy-purple-deep", ring: "border-candy-purple" },
  yellow: { pop: "pop-yellow", soft: "bg-candy-yellow-soft", text: "text-candy-yellow-deep", ring: "border-candy-yellow" },
  mint: { pop: "pop-mint", soft: "bg-candy-mint-soft", text: "text-candy-mint-deep", ring: "border-candy-mint" },
};
