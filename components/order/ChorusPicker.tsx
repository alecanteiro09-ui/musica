"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { selectChorusAndGenerateFullLyric, regenerateChorusOptions } from "@/lib/actions/lyrics";
import type { OrderLyric } from "@/types";
import { cn } from "@/lib/utils";

export function ChorusPicker({
  buyerToken,
  nickname,
  options,
}: {
  buyerToken: string;
  nickname: string;
  options: OrderLyric[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRegenerating, startRegenerate] = useTransition();

  function confirm() {
    if (!selected) return;
    startTransition(async () => {
      await selectChorusAndGenerateFullLyric(buyerToken, selected);
    });
  }

  function regenerate() {
    setSelected(null);
    startRegenerate(async () => {
      await regenerateChorusOptions(buyerToken);
    });
  }

  const busy = isPending || isRegenerating;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">sua letra, do seu jeito</p>
      <h1 className="mt-2 text-center font-display text-2xl italic text-ink">Qual refrão fica melhor?</h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        É a parte que mais se canta. Escolha a que te tocar — dá pra ajustar tudo depois.
      </p>

      <div className={cn("mt-8 flex flex-col gap-4 transition-opacity", isRegenerating && "opacity-40")}>
        {options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            disabled={busy}
            onClick={() => setSelected(opt.content)}
            className={cn(
              "rounded-xl border p-5 text-left text-sm leading-relaxed transition-colors disabled:cursor-not-allowed",
              selected === opt.content ? "border-accent bg-accent-soft text-ink" : "border-base-border bg-base-soft text-ink-muted"
            )}
          >
            <span className="mb-2 block text-xs uppercase tracking-wide text-ink-muted">Opção {i + 1}</span>
            {opt.content.split("\n").map((line, j) => (
              <span key={j} className="block">
                {line}
              </span>
            ))}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={regenerate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-base-border px-6 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-accent-dim hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw size={15} className={isRegenerating ? "animate-spin" : undefined} />
        {isRegenerating ? "Reescrevendo com IA..." : "Não curti nenhum — reescrever com IA"}
      </button>

      <button
        type="button"
        disabled={!selected || busy}
        onClick={confirm}
        className="mt-3 w-full rounded-full bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? `Escrevendo a letra de ${nickname || "sua música"}...` : "Usar este refrão"}
      </button>
    </div>
  );
}
