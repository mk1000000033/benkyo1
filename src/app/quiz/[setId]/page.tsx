import { notFound } from "next/navigation";
import { getActiveSet, getSubject, toSummary } from "@/server/quiz-registry";
import { QuizPlayer } from "./QuizPlayer";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { setId } = await params;
  const { mode } = await searchParams;
  const set = getActiveSet(setId);
  if (!set) notFound();
  const subject = getSubject(set.subjectId);
  // ここで渡すのはタイトル等のメタ情報のみ（問題本文はAPIから、正答は回答後にのみ届く）
  return <QuizPlayer set={toSummary(set)} subjectName={subject?.name ?? ""} forceNew={mode === "new"} />;
}
