import type { WordTimestamp } from "@/types";
import type { GenerateSongInput, GenerationStatus, MusicProvider } from "../music";

const MOCK_READY_AFTER_MS = 6000; // simula ~1min real "encurtado" pra não travar o dev
const MOCK_DURATION_SECONDS = 55;

interface MockJob {
  startedAt: number;
  words: string[];
}

// Mapa em memória — só faz sentido em processo único de desenvolvimento.
// Nunca é usado quando MUSIC_PROVIDER aponta pra um provedor real.
const jobs = new Map<string, MockJob>();

function wordsFromLyric(lyric: string): string[] {
  return lyric
    .split("\n")
    .filter((line) => !line.trim().startsWith("["))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);
}

function interpolateTimestamps(words: string[], durationSeconds: number): WordTimestamp[] {
  const step = durationSeconds / Math.max(1, words.length);
  return words.map((word, i) => ({ word, start: +(i * step).toFixed(2), end: +((i + 1) * step).toFixed(2) }));
}

export const mockMusicProvider: MusicProvider = {
  async generateSong(input: GenerateSongInput) {
    const providerJobId = `mock_${input.orderId}_${Date.now()}`;
    jobs.set(providerJobId, { startedAt: Date.now(), words: wordsFromLyric(input.lyric) });
    return { providerJobId };
  },

  async getGenerationStatus(providerJobId: string): Promise<GenerationStatus> {
    const job = jobs.get(providerJobId);
    if (!job) return { status: "failed" };

    const elapsed = Date.now() - job.startedAt;
    if (elapsed < MOCK_READY_AFTER_MS) return { status: "processing" };

    const wordTimestamps = interpolateTimestamps(job.words, MOCK_DURATION_SECONDS);
    return {
      status: "ready",
      tracks: [
        {
          variant: "take_1",
          audioUrl: `/api/mock-audio/${providerJobId}-take1`,
          durationSeconds: MOCK_DURATION_SECONDS,
          wordTimestamps,
        },
      ],
    };
  },
};
