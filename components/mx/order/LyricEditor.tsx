"use client";

import { useState, useTransition } from "react";
import { startSongGeneration } from "@/lib/actions/orders";

export function LyricEditor({ buyerToken, initialLyric }: { buyerToken: string; initialLyric: string }) {
  const [text, setText] = useState(initialLyric);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await startSongGeneration(buyerToken, text);
    });
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">ya casi</p>
      <h1 className="mt-2 text-center font-display text-2xl italic text-ink">Esta es tu letra</h1>
      <p className="mt-2 text-center text-sm text-ink-muted">Cambia lo que quieras — es ella la que se vuelve canción.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={16}
        className="mt-8 w-full rounded-xl border border-base-border bg-base-soft px-4 py-4 font-mono text-sm leading-relaxed text-ink outline-none focus:border-accent"
      />

      <button
        type="button"
        disabled={isPending || text.trim().length < 20}
        onClick={confirm}
        className="mt-6 w-full rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? "Enviando a grabación..." : "Está lista — grabar canción"}
      </button>
    </div>
  );
}
