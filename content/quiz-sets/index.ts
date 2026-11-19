// ============================================================================
// 問題セットの登録簿
//   新しい問題セットを追加したら、ここに import を1行と、配列に1要素を追加します。
//   ・既存の行は消さないこと（公開済みセットの旧バージョンも残します）
//   ・このファイルはサーバー側（src/server/quiz-registry.ts）からのみ読み込まれ、
//     正答がブラウザに送られることはありません。
// ============================================================================

import sample_pharmacology_basics_v1 from "./sample-pharmacology-basics.v1.json";

export const QUIZ_SET_FILES: unknown[] = [
  sample_pharmacology_basics_v1,
  // ↑ ここに新しい問題セットを追加
];
