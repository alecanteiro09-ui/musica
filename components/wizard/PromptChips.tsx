"use client";

/** Toques rápidos que começam a frase pra quem trava na hora de escrever. Só age se o campo ainda estiver vazio — nunca sobrescreve o que a pessoa já digitou. */
export function PromptChips({
  chips,
  value,
  onPick,
}: {
  chips: string[];
  value: string;
  onPick: (starter: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap justify-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          disabled={value.trim().length > 0}
          onClick={() => onPick(chip)}
          className="rounded-full border border-base-border bg-base px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-accent-dim hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
