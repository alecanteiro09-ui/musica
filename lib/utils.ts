import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata centavos como "R$ 49,90" */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Extrai as seções [Tag]/texto de uma letra formatada para exibição/karaokê */
export function parseTaggedLyric(content: string): { tag: string; lines: string[] }[] {
  const blocks = content.split(/\n(?=\[)/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const match = block.match(/^\[(.+?)\]\s*([\s\S]*)$/);
    if (!match) return { tag: "", lines: block.split("\n").filter(Boolean) };
    const [, tag, rest] = match;
    return { tag, lines: rest.split("\n").map((l) => l.trim()).filter(Boolean) };
  });
}
