import type { WizardAnswers } from "@/types";
import { mockLyricsProvider } from "./providers/mock-lyrics";
import { anthropicLyricsProvider } from "./providers/anthropic-lyrics";

export interface ChorusOptions {
  optionA: string;
  optionB: string;
}

export interface LyricsProvider {
  /** Gera 2 opções curtas de refrão a partir das respostas do wizard. */
  generateChorusOptions(input: WizardAnswers): Promise<ChorusOptions>;
  /** Escreve a letra completa (com tags [Verse 1]/[Chorus]/[Bridge]/...) em volta do refrão escolhido. */
  generateFullLyric(input: WizardAnswers & { chosenChorus: string }): Promise<string>;
}

/**
 * Seleciona o provedor por env var. Sem LYRICS_PROVIDER e sem ANTHROPIC_API_KEY
 * configurados, cai automaticamente no mock — assim `npm run dev` funciona
 * sem nenhuma conta criada.
 */
export function getLyricsProvider(): LyricsProvider {
  const forced = process.env.LYRICS_PROVIDER;
  if (forced === "mock") return mockLyricsProvider;
  if (forced === "anthropic") return anthropicLyricsProvider;
  return process.env.ANTHROPIC_API_KEY ? anthropicLyricsProvider : mockLyricsProvider;
}
