import type { WordTimestamp } from "@/types";
import { mockMusicProvider } from "./providers/mock-music";
import { realMusicProvider } from "./providers/real-music";

export interface GenerateSongInput {
  orderId: string;
  lyric: string;
  genre: string;
  voicePreference: string;
  /** Clima emocional opcional escolhido no wizard (romântico, divertido, emocionante, animado). */
  mood?: string;
  /** voiceId clonado (ver lib/ai/voiceClone.ts) — quando presente, a música sai cantada nessa voz em vez da voz padrão da IA. */
  voiceId?: string | null;
}

export interface GeneratedTrack {
  variant: "take_1" | "take_2";
  audioUrl: string;
  durationSeconds: number;
  wordTimestamps?: WordTimestamp[];
}

export interface GenerationStatus {
  status: "queued" | "processing" | "ready" | "failed";
  tracks?: GeneratedTrack[];
}

export interface MusicProvider {
  generateSong(input: GenerateSongInput): Promise<{ providerJobId: string }>;
  getGenerationStatus(providerJobId: string): Promise<GenerationStatus>;
}

/**
 * Seleciona o provedor por env var. Sem MUSIC_PROVIDER e sem MUSIC_API_KEY,
 * cai no mock: um tom sintetizado em runtime (não é música de verdade — ver
 * lib/ai/providers/mock-music.ts) que existe só para exercitar o fluxo
 * completo (progresso, preview, karaokê) sem depender de conta paga.
 */
export function getMusicProvider(): MusicProvider {
  const forced = process.env.MUSIC_PROVIDER;
  if (forced === "mock") return mockMusicProvider;
  if (forced && forced !== "mock") return realMusicProvider;
  return process.env.MUSIC_API_KEY ? realMusicProvider : mockMusicProvider;
}
