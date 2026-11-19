import { notFound } from "next/navigation";
import { getSubject, getTheme, getThemeItems } from "@/lib/quiz-registry";
import { MixPlayer } from "./MixPlayer";

export default async function ThemePage({ params }: { params: Promise<{ subjectId: string; themeId: string }> }) {
  const { subjectId, themeId } = await params;
  const subject = getSubject(subjectId);
  const theme = getTheme(subjectId, themeId);
  const items = getThemeItems(subjectId, themeId);
  if (!subject || !theme || items.length === 0) notFound();
  return <MixPlayer subject={{ id: subject.id, name: subject.name }} theme={theme} items={items} />;
}
