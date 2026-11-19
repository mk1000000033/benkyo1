// ============================================================================
// 問題セットの登録簿
//   新しい問題セットを追加したら、ここに import を1行と、配列に1要素を追加します。
//   ・既存の行は消さないこと（公開済みセットの旧バージョンも残します）
//   ・このファイルはサーバー側（src/server/quiz-registry.ts）からのみ読み込まれ、
//     正答がブラウザに送られることはありません。
// ============================================================================

import sample_pharmacology_basics_v1 from "./sample-pharmacology-basics.v1.json";
import natural_products_2024_q2_v1 from "./natural-products-2024-q2.v1.json";
import natural_products_2024_q3_v1 from "./natural-products-2024-q3.v1.json";
import natural_products_2024_q4_v1 from "./natural-products-2024-q4.v1.json";
import natural_products_2024_q5_v1 from "./natural-products-2024-q5.v1.json";
import natural_products_2024_q6_v1 from "./natural-products-2024-q6.v1.json";
import natural_products_2024_q7_v1 from "./natural-products-2024-q7.v1.json";

export const QUIZ_SET_FILES: unknown[] = [
  sample_pharmacology_basics_v1,
  natural_products_2024_q2_v1,
  natural_products_2024_q3_v1,
  natural_products_2024_q4_v1,
  natural_products_2024_q5_v1,
  natural_products_2024_q6_v1,
  natural_products_2024_q7_v1,
  // ↑ ここに新しい問題セットを追加
];
