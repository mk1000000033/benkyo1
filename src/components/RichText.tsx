// **太字** と ==マーカー== を表示する（まとめ・クイズの解説で使う）
import { Fragment } from "react";

export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
        if (part.startsWith("==") && part.endsWith("=="))
          return (
            <mark key={i} className="rounded bg-[linear-gradient(transparent_55%,#fff0a8_55%)] px-0.5 font-bold text-inherit">
              {part.slice(2, -2)}
            </mark>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
