"use client";

import { cn } from "@/lib/utils";

interface Option {
  emoji: string;
  label: string;
}

export function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.label)}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
            value === opt.label
              ? "border-accent bg-accent-soft text-ink"
              : "border-base-border bg-base-soft text-ink-muted hover:border-accent-dim"
          )}
        >
          <span aria-hidden>{opt.emoji}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
