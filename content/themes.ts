// テーマ（年度をまたいで問題を集めるためのタグ）
//   問題 JSON の各問題に "tags": ["pathway", ...] のように書くと、そのテーマに入ります。
//   タグは採点に関係しないので、公開後に付け直してもバージョンを上げる必要はありません。

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const THEMES: Record<string, Theme[]> = {
  "natural-products": [
    { id: "pathway", name: "生合成経路", emoji: "🛤️", description: "酢酸－マロン酸・シキミ酸・複合経路など" },
    { id: "mechanism", name: "作用機序・用途", emoji: "🎯", description: "何を阻害する？何の薬？" },
    { id: "origin", name: "生薬・植物・由来", emoji: "🌿", description: "どの植物・生物から？何科？" },
    { id: "antibiotic", name: "抗生物質・抗腫瘍", emoji: "🦠", description: "系統・産生菌・抗がん作用" },
    { id: "structure", name: "構造・分類", emoji: "🔍", description: "化合物群・骨格・構造の特徴" },
    { id: "stereo", name: "立体配置", emoji: "🧭", description: "R / S・E / Z の答え" },
    { id: "basics", name: "分離・糖・脂肪酸", emoji: "🧪", description: "液々分配・エピマー・DHA/EPA など" },
  ],
};

export function themesOf(subjectId: string): Theme[] {
  return THEMES[subjectId] ?? [];
}
