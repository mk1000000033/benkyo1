import { notFound } from "next/navigation";
import { buildSetDeck, getActiveSet } from "@/lib/quiz-registry";
import { CardDeck } from "@/components/CardDeck";

export default async function SetCardsPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const set = getActiveSet(setId);
  const cards = buildSetDeck(setId);
  if (!set || cards.length === 0) notFound();
  return <CardDeck title={set.title} emoji="📂" cards={cards} backHref={`/subjects/${set.subjectId}`} backLabel="セット一覧" />;
}
