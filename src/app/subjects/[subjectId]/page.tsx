import { notFound } from "next/navigation";
import { getSubject, listActiveSummaries } from "@/server/quiz-registry";
import { SetListView } from "./SetListView";

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();
  return (
    <SetListView
      subject={{ id: subject.id, name: subject.name, emoji: subject.emoji, color: subject.color }}
      sets={listActiveSummaries(subject.id)}
    />
  );
}
