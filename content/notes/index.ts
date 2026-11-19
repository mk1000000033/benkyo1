// ============================================================================
// まとめ（学習ノート）の登録簿
//   ファイル名は <問題セットID>.json。追加したら import と配列に1行ずつ追加します。
//   まとめは得点に関係しないため、バージョン管理せずそのまま書き換えてOKです。
// ============================================================================

import sample_pharmacology_basics from "./sample-pharmacology-basics.json";
import natural_products_2024_q2 from "./natural-products-2024-q2.json";
import natural_products_2024_q3 from "./natural-products-2024-q3.json";
import natural_products_2024_q4 from "./natural-products-2024-q4.json";
import natural_products_2024_q5 from "./natural-products-2024-q5.json";
import natural_products_2024_q6 from "./natural-products-2024-q6.json";
import natural_products_2024_q7 from "./natural-products-2024-q7.json";

export const NOTE_FILES: unknown[] = [
  sample_pharmacology_basics,
  natural_products_2024_q2,
  natural_products_2024_q3,
  natural_products_2024_q4,
  natural_products_2024_q5,
  natural_products_2024_q6,
  natural_products_2024_q7,
  // ↑ ここに新しいまとめを追加
];
