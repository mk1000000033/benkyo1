// 「まとめ」（授業資料をやさしくまとめた学習ノート）のデータ形式
//   文章中では **太字** と ==マーカー== が使えます。

export type NoteColor = "pink" | "sky" | "purple" | "yellow" | "mint";

export type NoteBlock =
  /** ふつうの文章 */
  | { type: "text"; text: string }
  /** 箇条書き（ポイント） */
  | { type: "points"; items: string[] }
  /** 順番のある流れ（①→②→③） */
  | { type: "steps"; items: string[] }
  /** 表（比較など） */
  | { type: "table"; headers: string[]; rows: string[][] }
  /** 覚え方・コツ（label 省略時「💡 ポイント」） */
  | { type: "tip"; text: string; label?: string }
  /** ひっかけ・注意（label 省略時「⚠️ ひっかけ注意」） */
  | { type: "caution"; text: string; label?: string }
  /** 公式（example に計算例） */
  | { type: "formula"; formula: string; note?: string; example?: string };

export interface NoteSection {
  emoji: string;
  title: string;
  color?: NoteColor;
  /** 根拠となる授業資料のページ（例: "p.3–5"） */
  sourcePage?: string | null;
  blocks: NoteBlock[];
}

/** content/notes/<セットID>.json の形式 */
export interface NoteFile {
  setId: string;
  /** ひとことで言うとこの回は何？ */
  lead: string;
  /** この回でわかること */
  goals: string[];
  sections: NoteSection[];
  /** キーワード集 */
  keywords?: { term: string; desc: string }[];
}
