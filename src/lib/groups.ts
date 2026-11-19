// 問題セットをフォルダ（group）ごとにまとめる
export interface SetGroup<T> {
  /** フォルダ名。null は「その他」 */
  name: string | null;
  sets: T[];
}

/** フォルダ名の新しい順（数字は数値として比較）に並べ、フォルダなしは最後にまとめる */
export function groupSets<T extends { group: string | null }>(sets: T[]): SetGroup<T>[] {
  const map = new Map<string | null, T[]>();
  for (const s of sets) {
    const key = s.group ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  const named = [...map.keys()]
    .filter((k): k is string => k !== null)
    .sort((a, b) => b.localeCompare(a, "ja", { numeric: true }));
  const out: SetGroup<T>[] = named.map((name) => ({ name, sets: map.get(name)! }));
  if (map.has(null)) out.push({ name: null, sets: map.get(null)! });
  return out;
}

/** フォルダ内では、タイトル先頭の年度（フォルダ名と同じもの）を省いて短く表示する */
export function titleInGroup(title: string, group: string | null): string {
  if (!group) return title;
  const m = /^(\d{4}年度)\s*/.exec(title);
  return m && group.startsWith(m[1]) ? title.slice(m[0].length) : title;
}
