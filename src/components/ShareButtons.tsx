"use client";
import { useEffect, useState } from "react";
import { canShareText, copyText, lineShareUrl, shareVia } from "@/lib/share";

/** 「LINEで送る」＋「その他で共有」（共有シートがない端末では「コピー」） */
export function ShareButtons({ text }: { text: string }) {
  const [hasShare, setHasShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setHasShare(canShareText()), []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <a
        href={lineShareUrl(text)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-pop text-sm text-white"
        style={{ background: "#06C755", ["--shadow" as string]: "#04a346" }}
      >
        💬 LINEで送る
      </a>
      {hasShare ? (
        <button type="button" className="btn-pop pop-white text-sm" onClick={() => void shareVia({ text })}>
          📤 その他で共有
        </button>
      ) : (
        <button
          type="button"
          className="btn-pop pop-white text-sm"
          onClick={async () => {
            if (await copyText(text)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          {copied ? "✓ コピーしました" : "📋 文章をコピー"}
        </button>
      )}
    </div>
  );
}
