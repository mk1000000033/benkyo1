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
  immunology: [
    { id: "cells", name: "免疫細胞", emoji: "🧫", description: "食細胞・抗原提示細胞・リンパ球" },
    { id: "organs", name: "リンパ器官", emoji: "🏫", description: "一次・二次リンパ器官・脾臓" },
    { id: "innate", name: "自然免疫", emoji: "📡", description: "バリア・食細胞・PRR・TLR・食作用・抗菌物質" },
    { id: "adaptive", name: "獲得免疫", emoji: "🎯", description: "NK細胞・T細胞の分化・細胞傷害・免疫学的記憶" },
  ],
  "analytical-chemistry-3": [
    { id: "prep", name: "役割・前処理", emoji: "🩸", description: "分析化学の役割・生体試料の前処理" },
    { id: "uv", name: "UV吸収", emoji: "🌈", description: "Trp・Tyr・Phe・ポストラベル法" },
    { id: "fluorescence", name: "蛍光", emoji: "✨", description: "OPA法・置換基・インターカレーション" },
    { id: "ir", name: "赤外・ラマン", emoji: "🔥", description: "振動の活性・特性吸収帯・指紋領域" },
    { id: "ms", name: "質量分析の基本", emoji: "⚖️", description: "ベースピーク・精密質量・質量の種類・窒素ルール" },
    { id: "dbe", name: "不飽和度", emoji: "🧮", description: "水素不足指数の計算" },
    { id: "msms", name: "MS/MS・開裂", emoji: "💥", description: "プレカーサー・プロダクト・衝突活性化・ECD/IRMPD" },
    { id: "ion", name: "イオン化法", emoji: "💦", description: "ESI・MALDI・多価イオン" },
  ],
};

export function themesOf(subjectId: string): Theme[] {
  return THEMES[subjectId] ?? [];
}
