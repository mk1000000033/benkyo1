import { notFound } from "next/navigation";
import { getActiveSet, getSubject } from "@/server/quiz-registry";
import { ResultView } from "./ResultView";

export default async function ResultPage({ params }: { params: Promise<{ setId: string; attemptId: string }> }) {
  const { setId, attemptId } = await params;
  const set = getActiveSet(setId);
  if (!set) notFound();
  return <ResultView setId={set.id} subjectId={set.subjectId} subjectName={getSubject(set.subjectId)?.name ?? ""} attemptId={attemptId} />;
}
