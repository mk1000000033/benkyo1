import { notFound } from "next/navigation";
import { getActiveSet, getNote, getSubject } from "@/lib/quiz-registry";
import { NoteView } from "@/components/NoteView";

export default async function NotePage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const set = getActiveSet(setId);
  const note = getNote(setId);
  if (!set || !note) notFound();
  return (
    <NoteView note={note} title={set.title} subjectName={getSubject(set.subjectId)?.name ?? ""} setId={set.id} subjectId={set.subjectId} />
  );
}
