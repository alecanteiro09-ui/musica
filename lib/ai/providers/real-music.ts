import { createAdminClient } from "@/lib/supabase/server";
import type { GenerateSongInput, GenerationStatus, MusicProvider } from "../music";
import type { WordTimestamp } from "@/types";

/**
 * Integração real com a Eleven Music API (ElevenLabs) — escolhida por ter API
 * oficial documentada, licença comercial inclusa desde o plano mais barato, e
 * suporte confirmado a vocais com letra própria (inclusive em português). Ver
 * decisão completa no README.
 *
 * IMPORTANTE: escrito a partir da documentação pública em
 * https://elevenlabs.io/docs/api-reference/music/compose — como essa API está
 * em evolução ativa (a ElevenLabs já mudou o pipeline de letras/timestamps
 * recentemente), CONFIRA o formato atual do request/response antes de usar em
 * produção. Dois pontos que podem ter mudado desde a escrita disto:
 *   1. Nome exato dos campos do body (`prompt`, `music_length_ms`, `model_id`).
 *   2. Se/como pedir os timestamps por palavra na resposta — a documentação
 *      menciona que a API passou a devolver "precise timestamps for every
 *      lyric", mas o modo exato de pedir isso (parâmetro de request, ou um
 *      content-type diferente de resposta) não estava claro nas fontes
 *      consultadas. Até confirmar, este arquivo cai no mesmo fallback do
 *      mock: interpola as palavras uniformemente dentro da duração da faixa.
 *
 * A API é síncrona (devolve os bytes do áudio numa única chamada, não um job
 * assíncrono pra fazer polling) — por isso generateSong() já faz todo o
 * trabalho pesado (2 chamadas + upload pro Storage) e getGenerationStatus()
 * só consulta o resultado guardado em memória. Numa function serverless com
 * timeout curto, isso pode estourar o limite — ajuste o timeout da function
 * (ou mova pra um worker/queue) antes de ir pra produção com volume real.
 */

const ELEVEN_MUSIC_ENDPOINT = "https://api.elevenlabs.io/v1/music";
const TARGET_DURATION_MS = 90_000; // 90s por faixa — ajuste depois de validar custo/qualidade

interface RealJob {
  status: "ready" | "failed";
  tracks: GenerationStatus["tracks"];
}

// Mapa em memória — mesma ressalva do mock: só faz sentido em processo Node
// persistente (`next dev` / servidor tradicional). Numa serverless real,
// troque por uma tabela (ex. reaproveitar order_tracks.provider_job_id como
// chave e ler o resultado do próprio banco) em vez de estado em memória.
const jobs = new Map<string, RealJob>();

function voiceLabel(v: string): string {
  if (v === "masculina") return "voz masculina";
  if (v === "dupla") return "dueto, vozes masculina e feminina";
  return "voz feminina";
}

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

async function composeOneTake(input: GenerateSongInput, seed: number): Promise<Buffer> {
  const apiKey = process.env.MUSIC_API_KEY;
  if (!apiKey) throw new Error("MUSIC_API_KEY não configurado.");

  const prompt = `Música ${input.genre || "pop"}, em português do Brasil, ${voiceLabel(
    input.voicePreference
  )}, cantando exatamente esta letra (respeite as seções indicadas entre colchetes):\n\n${input.lyric}`;

  const res = await fetch(ELEVEN_MUSIC_ENDPOINT, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: TARGET_DURATION_MS,
      seed,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao gerar música na Eleven Music API (${res.status}): ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export const realMusicProvider: MusicProvider = {
  async generateSong(input: GenerateSongInput) {
    const providerJobId = `elevenlabs_${input.orderId}_${Date.now()}`;
    const supabase = createAdminClient();
    const words = wordsFromLyric(input.lyric);
    const durationSeconds = TARGET_DURATION_MS / 1000;

    try {
      const [take1, take2] = await Promise.all([
        composeOneTake(input, 1),
        composeOneTake(input, 2),
      ]);

      const tracks = await Promise.all(
        [take1, take2].map(async (audio, i) => {
          const variant = i === 0 ? "take_1" : "take_2";
          const path = `${input.orderId}/${variant}.mp3`;
          const { error } = await supabase.storage.from("tracks").upload(path, audio, {
            contentType: "audio/mpeg",
            upsert: true,
          });
          if (error) throw new Error(`Falha ao subir ${variant} pro Storage: ${error.message}`);
          return {
            variant: variant as "take_1" | "take_2",
            audioUrl: path,
            durationSeconds,
            wordTimestamps: interpolateTimestamps(words, durationSeconds),
          };
        })
      );

      jobs.set(providerJobId, { status: "ready", tracks });
    } catch (err) {
      jobs.set(providerJobId, { status: "failed", tracks: undefined });
      throw err;
    }

    return { providerJobId };
  },

  async getGenerationStatus(providerJobId: string): Promise<GenerationStatus> {
    const job = jobs.get(providerJobId);
    if (!job) return { status: "processing" };
    return { status: job.status, tracks: job.tracks };
  },
};
