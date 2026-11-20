import { notFound } from "next/navigation";
import { COMPOUND_FILES } from "@content/compounds";
import { getSubject } from "@/lib/quiz-registry";
import { CompoundTable } from "./CompoundTable";

export function generateStaticParams() {
  return Object.keys(COMPOUND_FILES).map((subjectId) => ({ subjectId }));
}

export default async function CompoundsPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  const file = COMPOUND_FILES[subjectId];
  if (!subject || !file) notFound();
  return <CompoundTable subject={{ id: subject.id, name: subject.name }} file={file} />;
}
