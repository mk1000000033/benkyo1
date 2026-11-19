import { notFound } from "next/navigation";
import { buildThemeDeck, getTheme } from "@/lib/quiz-registry";
import { CardDeck } from "@/components/CardDeck";

export default async function ThemeCardsPage({ params }: { params: Promise<{ subjectId: string; themeId: string }> }) {
  const { subjectId, themeId } = await params;
  const theme = getTheme(subjectId, themeId);
  const cards = buildThemeDeck(subjectId, themeId);
  if (!theme || cards.length === 0) notFound();
  return <CardDeck title={theme.name} emoji={theme.emoji} cards={cards} backHref={`/themes/${subjectId}/${themeId}`} backLabel="テーマへ" />;
}
