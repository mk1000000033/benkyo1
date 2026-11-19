import { notFound } from "next/navigation";
import { getActiveSet, getAllVersions, getNote, getSubject } from "@/lib/quiz-registry";
import { ResultView } from "./ResultView";

export default async function ResultPage({ params }: { params: Promise<{ setId: string; attemptId: string }> }) {
  const { setId, attemptId } = await params;
  const set = getActiveSet(setId);
  if (!set) notFound();
  return (
    <ResultView
      versions={getAllVersions(set.id)}
      subjectId={set.subjectId}
      subjectName={getSubject(set.subjectId)?.name ?? ""}
      attemptId={attemptId}
      hasNote={!!getNote(set.id)}
    />
  );
}
