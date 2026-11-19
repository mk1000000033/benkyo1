import { notFound } from "next/navigation";
import { getActiveSet, getSubject } from "@/lib/quiz-registry";
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
  return <QuizPlayer set={set} subjectName={getSubject(set.subjectId)?.name ?? ""} forceNew={mode === "new"} />;
}
