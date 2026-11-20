// ============================================================================
// 問題セットの登録簿
//   新しい問題セットを追加したら、ここに import を1行と、配列に1要素を追加します。
//   ・既存の行は消さないこと（公開済みセットの旧バージョンも残します）
//   ・このファイルはサーバー側（src/server/quiz-registry.ts）からのみ読み込まれ、
//     正答がブラウザに送られることはありません。
// ============================================================================

import natural_products_2024_q2_v1 from "./natural-products-2024-q2.v1.json";
import natural_products_2024_q3_v1 from "./natural-products-2024-q3.v1.json";
import natural_products_2024_q4_v1 from "./natural-products-2024-q4.v1.json";
import natural_products_2024_q5_v1 from "./natural-products-2024-q5.v1.json";
import natural_products_2024_q6_v1 from "./natural-products-2024-q6.v1.json";
import natural_products_2024_q7_v1 from "./natural-products-2024-q7.v1.json";
import natural_products_2023_q2_v1 from "./natural-products-2023-q2.v1.json";
import natural_products_2023_q3_v1 from "./natural-products-2023-q3.v1.json";
import natural_products_2023_q4_v1 from "./natural-products-2023-q4.v1.json";
import natural_products_2023_q5_v1 from "./natural-products-2023-q5.v1.json";
import natural_products_2023_q6_v1 from "./natural-products-2023-q6.v1.json";
import natural_products_2023_q7_v1 from "./natural-products-2023-q7.v1.json";
import natural_products_2023_q8_v1 from "./natural-products-2023-q8.v1.json";
import natural_products_2022_q3_v1 from "./natural-products-2022-q3.v1.json";
import natural_products_2022_q4_v1 from "./natural-products-2022-q4.v1.json";
import natural_products_2022_q5_v1 from "./natural-products-2022-q5.v1.json";
import natural_products_2022_q6_v1 from "./natural-products-2022-q6.v1.json";
import natural_products_2022_q7_v1 from "./natural-products-2022-q7.v1.json";
import natural_products_2022_q8_v1 from "./natural-products-2022-q8.v1.json";
import natural_products_2022_q9_v1 from "./natural-products-2022-q9.v1.json";

export const QUIZ_SET_FILES: unknown[] = [
  natural_products_2024_q2_v1,
  natural_products_2024_q3_v1,
  natural_products_2024_q4_v1,
  natural_products_2024_q5_v1,
  natural_products_2024_q6_v1,
  natural_products_2024_q7_v1,
  natural_products_2023_q2_v1,
  natural_products_2023_q3_v1,
  natural_products_2023_q4_v1,
  natural_products_2023_q5_v1,
  natural_products_2023_q6_v1,
  natural_products_2023_q7_v1,
  natural_products_2023_q8_v1,
  natural_products_2022_q3_v1,
  natural_products_2022_q4_v1,
  natural_products_2022_q5_v1,
  natural_products_2022_q6_v1,
  natural_products_2022_q7_v1,
  natural_products_2022_q8_v1,
  natural_products_2022_q9_v1,
  // ↑ ここに新しい問題セットを追加
];
