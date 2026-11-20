// まとめJSONの形式チェック
const COLORS = ["pink", "sky", "purple", "yellow", "mint"];

const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const strArr = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(str);

export function validateNote(data: unknown, knownSetIds: string[]): string[] {
  const errors: string[] = [];
  if (!data || typeof data !== "object") return ["JSONがオブジェクトではありません"];
  const n = data as Record<string, unknown>;
  const label = `まとめ(${String(n.setId)})`;

  if (!str(n.setId) || !knownSetIds.includes(n.setId)) errors.push(`${label}: setId が問題セットのIDと一致しません`);
  if (!str(n.lead)) errors.push(`${label}: lead（ひとこと説明）がありません`);
  if (!strArr(n.goals)) errors.push(`${label}: goals（この回でわかること）を1つ以上書いてください`);
  if (n.keywords !== undefined) {
    if (!Array.isArray(n.keywords) || !n.keywords.every((k) => k && str(k.term) && str(k.desc))) {
      errors.push(`${label}: keywords は { term, desc } の配列にしてください`);
    }
  }
  if (!Array.isArray(n.sections) || n.sections.length === 0) return [...errors, `${label}: sections がありません`];

  n.sections.forEach((raw, i) => {
    const where = `${label} セクション${i + 1}`;
    const s = (raw ?? {}) as Record<string, unknown>;
    if (!str(s.emoji)) errors.push(`${where}: emoji がありません`);
    if (!str(s.title)) errors.push(`${where}: title がありません`);
    if (s.color !== undefined && !COLORS.includes(String(s.color))) errors.push(`${where}: color は ${COLORS.join(" / ")} のいずれか`);
    if (s.sourcePage != null && typeof s.sourcePage !== "string") errors.push(`${where}: sourcePage は文字列か null`);
    if (!Array.isArray(s.blocks) || s.blocks.length === 0) return void errors.push(`${where}: blocks がありません`);
    s.blocks.forEach((rb, j) => {
      const w = `${where} ブロック${j + 1}`;
      const b = (rb ?? {}) as Record<string, unknown>;
      switch (b.type) {
        case "text":
          if (!str(b.text)) errors.push(`${w}: text がありません`);
          break;
        case "points":
        case "steps":
          if (!strArr(b.items)) errors.push(`${w}: items を1つ以上書いてください`);
          break;
        case "table": {
          if (!strArr(b.headers)) { errors.push(`${w}: headers がありません`); break; }
          const cols = (b.headers as string[]).length;
          if (!Array.isArray(b.rows) || b.rows.length === 0) errors.push(`${w}: rows がありません`);
          else if (!b.rows.every((r) => Array.isArray(r) && r.length === cols && r.every((c) => typeof c === "string"))) {
            errors.push(`${w}: 各行の列数を headers（${cols}列）と同じにしてください`);
          }
          break;
        }
        case "tip":
        case "caution":
          if (!str(b.text)) errors.push(`${w}: text がありません`);
          break;
        case "formula":
          if (!str(b.formula)) errors.push(`${w}: formula がありません`);
          break;
        case "image":
          if (!str(b.src) || !/^\/structures\/[\w\-/]+\.(png|jpg|webp)$/.test(String(b.src))) errors.push(`${w}: src は "/structures/〜.png" の形にしてください`);
          if (!str(b.alt)) errors.push(`${w}: alt（画像の説明）がありません`);
          break;
        default:
          errors.push(`${w}: type "${String(b.type)}" は使えません（text / points / steps / table / tip / caution / formula / image）`);
      }
    });
  });
  return errors;
}
