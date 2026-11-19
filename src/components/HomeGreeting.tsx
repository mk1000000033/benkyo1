"use client";
// ホームで委員長があいさつ（時間帯・連続日数で変わる）
import { useEffect, useState } from "react";
import { greeting, type Mood } from "@/lib/iincho";
import { loadDailyLog, streak } from "@/lib/daily";
import { IinchoSays } from "./Iincho";

export function HomeGreeting() {
  const [g, setG] = useState<{ mood: Mood; line: string } | null>(null);
  useEffect(() => {
    const now = new Date();
    setG(greeting(now, streak(loadDailyLog(), now)));
  }, []);
  if (!g) return <div className="h-[76px]" aria-hidden />;
  return <IinchoSays mood={g.mood} line={g.line} />;
}
