// 問題データの登録簿を読むモジュール（ページのサーバー側でだけ使う）。
//   "server-only" により、全セットのデータがブラウザ用コードに丸ごと入ることを防ぎます。
import "server-only";
import { QUIZ_SET_FILES } from "@content/quiz-sets";
import { NOTE_FILES } from "@content/notes";
import { SUBJECTS, findSubject, type Subject } from "@content/subjects";
import { themesOf } from "@content/themes";
import { validateQuizSet, asQuizSet } from "@/lib/quiz-validate";
import { validateNote } from "@/lib/note-validate";
import type { NoteFile } from "@/lib/note-types";
import type { Question, QuizSetFile, QuizSetSummary } from "@/lib/quiz-types";

const HIDE_SAMPLES = process.env.HIDE_SAMPLE_SETS === "true";

function loadAll(): QuizSetFile[] {
  const subjectIds = SUBJECTS.map((s) => s.id);
  const seen = new Set<string>();
  const sets: QuizSetFile[] = [];
  for (const raw of QUIZ_SET_FILES) {
    const errors = validateQuizSet(raw, subjectIds);
    if (errors.length) throw new Error(`問題データにエラーがあります:\n${errors.join("\n")}`);
    const set = asQuizSet(raw);
    const key = `${set.id}@${set.version}`;
    if (seen.has(key)) throw new Error(`同じ id とバージョンの問題セットが重複しています: ${key}`);
    seen.add(key);
    sets.push(set);
  }
  return sets;
}

const ALL_SETS = loadAll();

// テーマのタグが content/themes.ts に存在するか確認
for (const set of ALL_SETS) {
  const ids = themesOf(set.subjectId).map((t) => t.id);
  for (const q of set.questions) {
    for (const t of q.tags ?? []) {
      if (!ids.includes(t)) throw new Error(`${set.id}@v${set.version} ${q.id}: テーマ "${t}" が content/themes.ts にありません`);
    }
  }
}

function loadNotes(): Map<string, NoteFile> {
  const ids = Array.from(new Set(ALL_SETS.map((s) => s.id)));
  const map = new Map<string, NoteFile>();
  for (const raw of NOTE_FILES) {
    const errors = validateNote(raw, ids);
    if (errors.length) throw new Error(`まとめデータにエラーがあります:\n${errors.join("\n")}`);
    const note = raw as NoteFile;
    if (map.has(note.setId)) throw new Error(`同じ問題セットのまとめが重複しています: ${note.setId}`);
    map.set(note.setId, note);
  }
  return map;
}

const NOTES = loadNotes();

/** 公開中の問題セットのまとめ（なければ undefined） */
export function getNote(setId: string): NoteFile | undefined {
  return getActiveSet(setId) ? NOTES.get(setId) : undefined;
}

function isVisible(set: QuizSetFile): boolean {
  return set.published && !(HIDE_SAMPLES && set.isSample);
}

/** 指定バージョンの問題セット（採点・復習用。旧バージョンも取得できる） */
export function getSetVersion(id: string, version: number): QuizSetFile | undefined {
  return ALL_SETS.find((s) => s.id === id && s.version === version);
}

/** 現在公開中（最新バージョン）の問題セット */
export function getActiveSet(id: string): QuizSetFile | undefined {
  // 最新バージョンが非公開なら、そのセット全体を非公開として扱う（旧版に戻らない）
  const latest = ALL_SETS.filter((s) => s.id === id).sort((a, b) => b.version - a.version)[0];
  return latest && isVisible(latest) ? latest : undefined;
}

export function toSummary(set: QuizSetFile): QuizSetSummary {
  return {
    id: set.id,
    version: set.version,
    subjectId: set.subjectId,
    title: set.title,
    lectureDate: set.lectureDate ?? null,
    group: set.group?.trim() || null,
    questionCount: set.questions.length,
    isSample: !!set.isSample,
    hasNote: NOTES.has(set.id),
  };
}

export function listActiveSummaries(subjectId?: string): QuizSetSummary[] {
  const ids = Array.from(new Set(ALL_SETS.map((s) => s.id)));
  return ids
    .map((id) => getActiveSet(id))
    .filter((s): s is QuizSetFile => !!s && (!subjectId || s.subjectId === subjectId))
    .map(toSummary)
    .sort((a, b) => {
      if (a.lectureDate && b.lectureDate && a.lectureDate !== b.lectureDate) return a.lectureDate < b.lectureDate ? -1 : 1;
      if (!!a.lectureDate !== !!b.lectureDate) return a.lectureDate ? -1 : 1;
      // まとめ付きのセット（大問ごと）を先に、構造式クイズなど問題だけのセットを後に
      if (a.hasNote !== b.hasNote) return a.hasNote ? -1 : 1;
      return a.title.localeCompare(b.title, "ja", { numeric: true });
    });
}

export interface SubjectWithCount extends Subject {
  setCount: number;
}

export function listSubjectsWithCounts(): SubjectWithCount[] {
  const summaries = listActiveSummaries();
  return SUBJECTS.filter((s) => !(HIDE_SAMPLES && s.isSample))
    .map((s) => ({ ...s, setCount: summaries.filter((x) => x.subjectId === s.id).length }))
    .filter((s) => !s.isSample || s.setCount > 0);
}

export function getSubject(id: string): Subject | undefined {
  const s = findSubject(id);
  if (!s || (HIDE_SAMPLES && s.isSample)) return undefined;
  return s;
}

/** 同じセットの全バージョン（過去の挑戦の復習用） */
export function getAllVersions(id: string): QuizSetFile[] {
  return ALL_SETS.filter((s) => s.id === id);
}

