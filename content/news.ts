// 新機能のお知らせ（トップ画面のポップアップ）
// 新しいお知らせは配列の先頭に足す。id を変えると、見た人にももう一度表示される。

export interface NewsItem {
  emoji: string;
  title: string;
  text: string;
  /** タップで移動する先（任意） */
  href?: string;
}

export interface News {
  id: string;
  /** 表示用の日付（例: "2026年11月21日"） */
  date: string;
  /** 委員長のひとこと */
  line: string;
  items: NewsItem[];
}

export const NEWS: News[] = [
  {
    id: "2026-11-21-structure-quiz",
    date: "2026年11月21日",
    line: "委員会より新機能のお知らせだ。再試回避の武器が増えたぞ。",
    items: [
      {
        emoji: "🧪",
        title: "構造式クイズ",
        text: "試験に出た構造式を見て、名前・化合物群・生合成経路を答えよう。各年度フォルダのいちばん下にあるよ。画像はタップで拡大できます。",
        href: "/subjects/natural-products",
      },
      {
        emoji: "🧩",
        title: "空欄がいくつもある穴埋め",
        text: "1問に空欄が2〜4個。全部うめて、全部合っていたら正解！",
      },
      {
        emoji: "📚",
        title: "横断まとめ",
        text: "4年分をまとめた「生合成経路別」「抗生物質」「お薬（抗生物質以外）」のまとめとクイズ。フォルダのいちばん上にあるよ。",
        href: "/subjects/natural-products",
      },
      {
        emoji: "📅",
        title: "過去問が4年分に",
        text: "天然物化学に 2022年度・2025年度 の中間試験を追加。2022〜2025年度がそろいました。",
      },
    ],
  },
];

export const LATEST_NEWS: News | null = NEWS[0] ?? null;
