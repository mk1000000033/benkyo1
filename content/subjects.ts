// 科目の一覧。新しい科目を追加するときは、この配列に1行追加するだけでOKです。
//   id    : 半角英小文字とハイフン（問題セットJSONの subjectId と一致させる）
//   color : pink / sky / purple / yellow / mint のいずれか
//   ※ 一度公開した科目の id は変更しないでください（ランキングとの対応が崩れます）

export type SubjectColor = "pink" | "sky" | "purple" | "yellow" | "mint";

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: SubjectColor;
  isSample?: boolean;
}

export const SUBJECTS: Subject[] = [
  { id: "natural-products", name: "天然物化学", emoji: "🌿", color: "mint" },
  { id: "basic-pharmacology", name: "基礎薬理学", emoji: "💊", color: "pink" },
  { id: "immunology", name: "免疫学", emoji: "🛡️", color: "sky" },
  { id: "organic-chemistry", name: "有機化学", emoji: "⚗️", color: "yellow" },
  { id: "analytical-chemistry-3", name: "分析化学3", emoji: "🧪", color: "purple" },
];

export function findSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
