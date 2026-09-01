import { createAdminClient } from "@/lib/supabase/server";
import type { GenerateSongInput, GenerationStatus, MusicProvider } from "../music";
import type { WordTimestamp } from "@/types";

/**
 * Integração real com a Mureka API — escolhida por ser bem mais barata que a
 * Eleven Music API (~US$0,02-0,04 por música vs ~US$0,54 por pedido), ter
 * licença comercial explícita desde o plano básico e ser "letra-primeiro"
 * (você manda a letra pronta, ela compõe melodia + vocal + arranjo em cima —
 * exatamente o nosso caso). Ver README para o trade-off aceito: a Kunlun Tech
 * (dona da Mureka) não publica de onde vêm os dados de treino do modelo —
 * mesmo tipo de risco de direitos autorais que o Suno tem, só que menor
 * porque os termos de revenda aqui são explícitos.
 *
 * IMPORTANTE: escrito a partir da documentação pública em
 * https://platform.mureka.ai/docs/ — o endpoint de criação (POST
 * /v1/song/generate) e a resposta inicial estão confirmados com exemplo
 * oficial, mas a doc pública NÃO mostra o formato completo da resposta do
 * endpoint de consulta (GET /v1/song/query/{task_id}) quando a música fica
 * pronta — nem os valores exatos que o campo `status` assume além de
 * "preparing". A extração abaixo tenta vários formatos plausíveis
 * (`extractAudioUrl`/`extractDurationSeconds`) e loga a resposta crua se não
 * encontrar nada — CONFIRA contra uma chamada real (já testamos a criação do
 * job com sucesso; falta validar o polling até completar) antes de confiar
 * em produção.
 */

const MUREKA_BASE = "https://api.mureka.ai/v1";

// getGenerationStatus() só recebe o providerJobId, mas precisa da letra pra
// calcular os tempos de palavra do karaokê — guardamos aqui, keyed pelo job,
// no momento em que a geração começa. Mesma ressalva do mock: só funciona em
// processo Node persistente (`next dev`); numa serverless real, guarde a
// letra em order_tracks (ela já existe no banco) e busque de lá em vez de
// depender de memória do processo.
const lyricByJobId = new Map<string, string>();

// Valores de status que já vimos confirmados ou que são o padrão mais comum
// em APIs assíncronas parecidas (Suno-like). Ajuste aqui se a Mureka usar
// nomes diferentes — é o único lugar que precisa mudar.
const SUCCESS_STATES = ["succeeded", "success", "completed", "complete", "finished"];
const FAILURE_STATES = ["failed", "failure", "error", "timeouted", "timeout", "cancelled"];

function voiceLabel(v: string): string {
  if (v === "masculina") return "male vocal";
  if (v === "dupla") return "duet, male and female vocal";
  return "female vocal";
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

function authHeaders(): Record<string, string> {
  const apiKey = process.env.MUSIC_API_KEY;
  if (!apiKey) throw new Error("MUSIC_API_KEY não configurado.");
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

async function startGeneration(input: GenerateSongInput): Promise<string> {
  const prompt = `${input.genre || "pop"}, ${voiceLabel(input.voicePreference)}, Brazilian Portuguese lyrics`;

  const res = await fetch(`${MUREKA_BASE}/song/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ lyrics: input.lyric, model: "auto", prompt }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao iniciar geração na Mureka (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.id) throw new Error(`Resposta da Mureka sem "id" de tarefa: ${JSON.stringify(data)}`);
  return String(data.id);
}

async function queryTask(taskId: string): Promise<any> {
  const res = await fetch(`${MUREKA_BASE}/song/query/${taskId}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao consultar tarefa Mureka ${taskId} (${res.status}): ${body}`);
  }
  return res.json();
}

/** Tenta achar a URL do mp3 em alguns formatos plausíveis de resposta — ver nota no topo do arquivo. */
function extractAudioUrl(raw: any): string | null {
  return (
    raw?.choices?.[0]?.mp3_url ??
    raw?.choices?.[0]?.url ??
    raw?.data?.[0]?.mp3_url ??
    raw?.song?.mp3_url ??
    raw?.mp3_url ??
    null
  );
}

function extractDurationSeconds(raw: any, fallbackWords: string[]): number {
  const ms =
    raw?.choices?.[0]?.duration_milliseconds ??
    raw?.data?.[0]?.duration_milliseconds ??
    raw?.song?.duration_milliseconds ??
    raw?.duration_milliseconds;
  if (typeof ms === "number" && ms > 0) return ms / 1000;
  // sem duração na resposta: estima ~0.4s por palavra (só para o karaokê ter uma base)
  return Math.max(20, fallbackWords.length * 0.4);
}

function extractStatus(raw: any): string {
  return String(raw?.status ?? raw?.state ?? "").toLowerCase();
}

async function downloadAndStore(url: string, path: string): Promise<void> {
  const audioRes = await fetch(url);
  if (!audioRes.ok) throw new Error(`Falha ao baixar áudio da Mureka (${audioRes.status}): ${url}`);
  const buffer = Buffer.from(await audioRes.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("tracks").upload(path, buffer, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (error) throw new Error(`Falha ao subir áudio pro Storage (${path}): ${error.message}`);
}

export const realMusicProvider: MusicProvider = {
  async generateSong(input: GenerateSongInput) {
    // 2 chamadas separadas = 2 tarefas independentes na Mureka (take_1/take_2).
    // Combinamos os dois task_ids num único providerJobId (separados por "::")
    // pra caber na nossa interface, que guarda um jobId só por pedido.
    const [taskId1, taskId2] = await Promise.all([startGeneration(input), startGeneration(input)]);
    const jobId = `${taskId1}::${taskId2}`;
    lyricByJobId.set(jobId, input.lyric);
    return { providerJobId: jobId };
  },

  async getGenerationStatus(providerJobId: string): Promise<GenerationStatus> {
    const [taskId1, taskId2] = providerJobId.split("::");
    const [raw1, raw2] = await Promise.all([queryTask(taskId1), queryTask(taskId2)]);

    const status1 = extractStatus(raw1);
    const status2 = extractStatus(raw2);

    if (FAILURE_STATES.includes(status1) || FAILURE_STATES.includes(status2)) {
      console.error("[mureka] tarefa falhou", { taskId1, status1, taskId2, status2 });
      return { status: "failed" };
    }

    const ready1 = SUCCESS_STATES.includes(status1);
    const ready2 = SUCCESS_STATES.includes(status2);
    if (!ready1 || !ready2) return { status: "processing" };

    const url1 = extractAudioUrl(raw1);
    const url2 = extractAudioUrl(raw2);
    if (!url1 || !url2) {
      console.error("[mureka] status concluído mas sem URL de áudio reconhecida", { raw1, raw2 });
      return { status: "failed" };
    }

    // orderId não está disponível aqui (só o jobId) — usamos os próprios
    // task_ids no caminho do Storage, únicos o bastante.
    const path1 = `mureka/${taskId1}.mp3`;
    const path2 = `mureka/${taskId2}.mp3`;
    await Promise.all([downloadAndStore(url1, path1), downloadAndStore(url2, path2)]);

    const words = wordsFromLyric(lyricByJobId.get(providerJobId) ?? "");
    const duration1 = extractDurationSeconds(raw1, words);
    const duration2 = extractDurationSeconds(raw2, words);

    return {
      status: "ready",
      tracks: [
        {
          variant: "take_1",
          audioUrl: path1,
          durationSeconds: duration1,
          wordTimestamps: interpolateTimestamps(words, duration1),
        },
        {
          variant: "take_2",
          audioUrl: path2,
          durationSeconds: duration2,
          wordTimestamps: interpolateTimestamps(words, duration2),
        },
      ],
    };
  },
};
