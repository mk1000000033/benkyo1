import { notFound } from "next/navigation";
import { getSubject, listActiveSummaries, listThemes } from "@/lib/quiz-registry";
import { SetListView } from "./SetListView";

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();
  return (
    <SetListView
      subject={{ id: subject.id, name: subject.name, emoji: subject.emoji, color: subject.color }}
      sets={listActiveSummaries(subject.id)}
      themes={listThemes(subject.id).map(({ id, name, emoji, count }) => ({ id, name, emoji, count }))}
    />
  );
}
