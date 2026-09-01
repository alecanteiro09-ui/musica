"use client";

import { useMemo } from "react";
import { parseTaggedLyric, cn } from "@/lib/utils";
import type { WordTimestamp } from "@/types";

export function KaraokeLyrics({
  lyric,
  wordTimestamps,
  currentTime,
  dark = false,
}: {
  lyric: string;
  wordTimestamps: WordTimestamp[] | null;
  currentTime: number;
  /** Página-presente entregue é escura (foto de fundo) — troca a paleta de texto clara/escura pro claro/escuro certo em vez de herdar as cores pensadas pro fundo claro do resto do site. */
  dark?: boolean;
}) {
  const blocks = useMemo(() => parseTaggedLyric(lyric), [lyric]);

  const activeIndex = useMemo(() => {
    if (!wordTimestamps || wordTimestamps.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < wordTimestamps.length; i++) {
      if (currentTime >= wordTimestamps[i].start) idx = i;
      else break;
    }
    return idx;
  }, [wordTimestamps, currentTime]);

  let globalWordIndex = -1;

  return (
    <div className="space-y-6 text-center">
      {blocks.map((block, bi) => (
        <div key={bi}>
          {block.lines.map((line, li) => (
            <p key={li} className={cn("text-lg leading-relaxed md:text-xl", dark ? "text-[#FBF7FA]" : "text-ink")}>
              {line.split(/\s+/).map((word, wi) => {
                globalWordIndex += 1;
                const isActive = wordTimestamps ? globalWordIndex === activeIndex : false;
                return (
                  <span
                    key={wi}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-accent" : dark ? "text-[#FBF7FA]/45" : "text-ink-muted"
                    )}
                  >
                    {word}{" "}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
