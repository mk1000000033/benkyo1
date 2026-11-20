// 化合物いちらん（content/compounds/<科目ID>.json）の形式

export type CompoundKind = "antibiotic" | "drug" | "natural";

export interface Compound {
  name: string;
  /** 絞り込み用のおおまかなグループ（例: "リグナン"、"マクロライド"、"その他"） */
  group: string;
  /** 化合物群・分類（資料の書き方。なければ空） */
  cls: string;
  /** 母骨格の生合成経路（確定していなければ空） */
  path: string;
  /** 何の薬か・はたらき */
  use: string;
  /** 基になった物質（例: エトポシド ← ポドフィロトキシン） */
  base: string;
  /** 由来（植物・微生物・生薬など） */
  origin: string;
  /** 分類の見分け方（**太字** ==マーカー== が使える） */
  why: string;
  kind: CompoundKind;
  /** 出題された年度 */
  years: number[];
  /** 構造式の画像（新しい年度から） */
  images: { src: string; caption: string }[];
}

export interface CompoundFile {
  subjectId: string;
  note: string;
  compounds: Compound[];
}
