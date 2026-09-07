"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSongGenerationProgress } from "@/lib/actions/orders";

const STAGES = [
  { upTo: 35, label: "Encontrando el tono de tu historia..." },
  { upTo: 75, label: "Dándole ritmo a las palabras..." },
  { upTo: 95, label: "Ajustando los últimos detalles..." },
];

// tiempo "esperado" solo para dibujar la barra — lo que decide de verdad es
// la respuesta del proveedor (ver checkSongGenerationProgress)
const EXPECTED_MS = 60_000;

export function GenerationProgress({ buyerToken }: { buyerToken: string }) {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const [percent, setPercent] = useState(2);

  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setPercent(Math.min(95, Math.round((elapsed / EXPECTED_MS) * 100)));
    }, 400);

    const poll = setInterval(async () => {
      const { status } = await checkSongGenerationProgress(buyerToken);
      if (status !== "song_generating") {
        setPercent(100);
        router.refresh();
      }
    }, 3000);

    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [buyerToken, router]);

  const stageLabel = STAGES.find((s) => percent <= s.upTo)?.label ?? STAGES[STAGES.length - 1].label;

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-accent">grabando</p>
      <h1 className="mt-2 font-display text-2xl italic text-ink">{stageLabel}</h1>
      <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-base-border">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-4 text-sm text-ink-muted">Toma cerca de 1 minuto. No necesitas quedarte en esta pantalla — te avisamos cuando esté lista.</p>
    </div>
  );
}
