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
 * encontrar nada.
 *
 * PREÇO/CONCORRÊNCIA (confirmado ao vivo, plataforma real): a Mureka cobra
 * por "compra" — cada tier trava um número fixo de requisições concorrentes
 * pelos próximos 12 meses (Trial US$10 = 1 concorrente, Basic US$1.000 = 5,
 * Standard US$3.000 = 15, Business US$5.000 = 25, Enterprise US$30.000 =
 * 150 — ver platform.mureka.ai/pricing). Isso não é o mesmo que "preço por
 * música" — é uma licença de capacidade. Com 1 concorrente (tier de teste),
 * as duas faixas do pedido têm que ser geradas em série de verdade, uma só
 * começando depois que a outra chega em "succeeded" — não basta só não
 * chamar em paralelo, tem que esperar terminar. É exatamente isso que
 * generateSong()/getGenerationStatus() fazem abaixo. Antes de ter tráfego
 * real, contratar um tier com mais concorrência — no tier de teste, dois
 * clientes comprando ao mesmo tempo colidem.
 */

const MUREKA_BASE = "https://api.mureka.ai/v1";

/**
 * A conta paga é por "compra" e cada tier trava um número fixo de
 * requisições CONCORRENTES — confirmado em platform.mureka.ai/pricing:
 * Trial (US$10) = 1 concorrente, Basic (US$1.000) = 5, e assim por diante.
 * "Concorrente" aqui é a tarefa de geração inteira, não só a chamada HTTP —
 * então com 1 slot, a segunda faixa (take_2) só pode ser *iniciada* depois
 * que a primeira (take_1) chegar em status de sucesso, não só depois do
 * take_1 responder à chamada de criação. generateSong() só inicia a
 * primeira; getGenerationStatus() inicia a segunda de forma preguiçosa, no
 * primeiro poll em que a primeira já estiver pronta.
 *
 * Guardamos esse estado em memória, keyed pelo jobId (= task_id da primeira
 * faixa). Mesma ressalva de sempre: só funciona em processo Node persistente
 * (`next dev`); numa serverless real, mova esse estado pra fora do processo
 * (ex. numa coluna em order_tracks) antes de ter tráfego de verdade.
 */
interface MurekaJob {
  input: GenerateSongInput;
  taskId1: string;
  taskId2: string | null;
  take1?: { audioUrl: string; durationSeconds: number };
}
const jobs = new Map<string, MurekaJob>();

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
    // Só inicia a PRIMEIRA faixa aqui. A segunda começa depois, dentro do
    // polling — ver nota acima sobre o limite de 1 requisição concorrente.
    const taskId1 = await startGeneration(input);
    jobs.set(taskId1, { input, taskId1, taskId2: null });
    return { providerJobId: taskId1 };
  },

  async getGenerationStatus(providerJobId: string): Promise<GenerationStatus> {
    const job = jobs.get(providerJobId);
    if (!job) return { status: "failed" };

    const words = wordsFromLyric(job.input.lyric);

    // Fase 1: esperando a primeira faixa (take_1) terminar.
    if (!job.taskId2) {
      const raw1 = await queryTask(job.taskId1);
      const status1 = extractStatus(raw1);

      if (FAILURE_STATES.includes(status1)) {
        console.error("[mureka] take_1 falhou", { taskId: job.taskId1, status1 });
        return { status: "failed" };
      }
      if (!SUCCESS_STATES.includes(status1)) return { status: "processing" };

      const url1 = extractAudioUrl(raw1);
      if (!url1) {
        console.error("[mureka] take_1 concluído mas sem URL de áudio reconhecida", raw1);
        return { status: "failed" };
      }
      const duration1 = extractDurationSeconds(raw1, words);
      const path1 = `mureka/${job.taskId1}.mp3`;
      await downloadAndStore(url1, path1);
      job.take1 = { audioUrl: path1, durationSeconds: duration1 };

      // take_1 pronto — só agora dá pra ocupar o único slot concorrente com a take_2.
      job.taskId2 = await startGeneration(job.input);
      jobs.set(providerJobId, job);
      return { status: "processing" };
    }

    // Fase 2: take_1 já pronto, esperando a take_2.
    const raw2 = await queryTask(job.taskId2);
    const status2 = extractStatus(raw2);

    if (FAILURE_STATES.includes(status2)) {
      console.error("[mureka] take_2 falhou", { taskId: job.taskId2, status2 });
      return { status: "failed" };
    }
    if (!SUCCESS_STATES.includes(status2)) return { status: "processing" };

    const url2 = extractAudioUrl(raw2);
    if (!url2) {
      console.error("[mureka] take_2 concluído mas sem URL de áudio reconhecida", raw2);
      return { status: "failed" };
    }
    const duration2 = extractDurationSeconds(raw2, words);
    const path2 = `mureka/${job.taskId2}.mp3`;
    await downloadAndStore(url2, path2);

    const take1 = job.take1!;
    jobs.delete(providerJobId);

    return {
      status: "ready",
      tracks: [
        {
          variant: "take_1",
          audioUrl: take1.audioUrl,
          durationSeconds: take1.durationSeconds,
          wordTimestamps: interpolateTimestamps(words, take1.durationSeconds),
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
