import { notFound } from "next/navigation";
import { getActiveSet, getSubject } from "@/server/quiz-registry";
import { RankingView } from "./RankingView";

export default async function RankingPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const set = getActiveSet(setId);
  if (!set) notFound();
  const subject = getSubject(set.subjectId);
  return <RankingView setId={set.id} title={set.title} subjectId={set.subjectId} subjectName={subject?.name ?? ""} />;
}
