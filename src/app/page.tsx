import { listSubjectsWithCounts } from "@/server/quiz-registry";
import { HomeView } from "./HomeView";

export default function HomePage() {
  // 科目と問題セット数（正答を含まないメタ情報だけを渡す）
  const subjects = listSubjectsWithCounts().map(({ id, name, emoji, color, isSample, setCount }) => ({
    id,
    name,
    emoji,
    color,
    isSample: !!isSample,
    setCount,
  }));
  return <HomeView subjects={subjects} />;
}
