import { createAdminClient } from "@/lib/supabase/server";
import type { GenerateSongInput, GenerationStatus, MusicProvider } from "../music";
import type { WordTimestamp } from "@/types";

/**
 * Integração real com o Suno via Kie.ai (kie.ai/suno-api) — o Suno em si não
 * tem API pública própria (só anunciou, em jul/2026, um programa de
 * parceiros fechado, sem documentação pública nem prazo). Esta é uma
 * decisão CONSCIENTE de assumir o risco de usar uma camada não-oficial:
 * sem licença de revenda explícita do Suno, sujeita a mudar ou ser cortada
 * sem aviso se o Suno decidir bloquear esses provedores. Ver README pra o
 * histórico completo da decisão (a alternativa mais segura era a Mureka —
 * dá pra ver essa implementação no histórico do git, caso precise voltar).
 *
 * Documentação oficial da Kie.ai (https://docs.kie.ai/suno-api/), testada:
 * - POST /api/v1/generate — cria a tarefa. A API sempre devolve 2 faixas em
 *   `sunoData`, mas o produto entrega só UMA música por pedido (decisão do
 *   usuário — mais simples pro cliente que uma escolha entre versões); só
 *   usamos `sunoData[0]`, a segunda fica sem download/uso.
 * - GET /api/v1/generate/record-info?taskId=X — consulta o status.
 * - Preço: 12 créditos (~US$0,06) por pedido completo (cobra pelas 2 faixas
 *   mesmo só usando 1 — não tem como pedir só uma da API).
 */

const KIE_BASE = "https://api.kie.ai/api/v1";
const MODEL = "V4_5"; // bom equilíbrio custo/qualidade — trocar por V5/V5_5 se quiser mais fidelidade

// getGenerationStatus() só recebe o providerJobId (= taskId), mas precisa
// da letra pra calcular os tempos de palavra do karaokê quando a API não
// devolve timing próprio — guardamos aqui, keyed pelo taskId, no momento em
// que a geração começa. Mesma ressalva de sempre: só funciona em processo
// Node persistente (`next dev`); numa serverless real, mova pra uma coluna
// em order_tracks (a letra já existe no banco) em vez de memória do processo.
const lyricByTaskId = new Map<string, string>();

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
  // Suno sempre deixa alguns segundos de introdução instrumental antes da
  // voz entrar. Sem descontar isso, a letra acendia adiantada em relação
  // ao que estava sendo cantado de verdade (bug reportado testando um
  // pedido real). Não temos timing palavra-a-palavra do provedor, então
  // isso é uma estimativa — mas uma folga proporcional no início já resolve
  // a maior parte do desalinhamento.
  const introOffset = Math.min(3, durationSeconds * 0.08);
  const sungDuration = Math.max(1, durationSeconds - introOffset);
  const step = sungDuration / Math.max(1, words.length);
  return words.map((word, i) => ({
    word,
    start: +(introOffset + i * step).toFixed(2),
    end: +(introOffset + (i + 1) * step).toFixed(2),
  }));
}

function authHeaders(): Record<string, string> {
  const apiKey = process.env.MUSIC_API_KEY;
  if (!apiKey) throw new Error("MUSIC_API_KEY não configurado.");
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

async function downloadAndStore(url: string, path: string): Promise<void> {
  const audioRes = await fetch(url);
  if (!audioRes.ok) throw new Error(`Falha ao baixar áudio (${audioRes.status}): ${url}`);
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
    const style = `${input.genre || "pop"}, ${voiceLabel(input.voicePreference)}, Brazilian Portuguese, warm and intimate lead vocal, radio-quality mix, emotionally sincere delivery, acoustic-leaning modern production, clear diction`;
    const title = `Verso Único — ${input.orderId.slice(0, 8)}`;

    // callBackUrl é obrigatório pra API aceitar o request (erro 422 sem ele),
    // mesmo não estando documentado como tal — mas não dependemos dele:
    // consultamos o status por polling (getGenerationStatus), então o valor
    // só precisa existir, não precisa ser alcançável durante dev local.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://verso-unico.example.com";

    const res = await fetch(`${KIE_BASE}/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        prompt: input.lyric,
        style,
        title,
        customMode: true,
        instrumental: false,
        model: MODEL,
        callBackUrl: `${siteUrl}/api/webhooks/suno`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao iniciar geração no Suno/Kie.ai (${res.status}): ${body}`);
    }

    const json = await res.json();
    const taskId = json?.data?.taskId;
    if (!taskId) throw new Error(`Resposta sem taskId: ${JSON.stringify(json)}`);

    lyricByTaskId.set(taskId, input.lyric);
    return { providerJobId: taskId };
  },

  async getGenerationStatus(providerJobId: string): Promise<GenerationStatus> {
    const res = await fetch(`${KIE_BASE}/generate/record-info?taskId=${providerJobId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Falha ao consultar tarefa ${providerJobId} (${res.status}): ${body}`);
    }

    const json = await res.json();
    const status: string = json?.data?.status ?? "";

    const FAILURE_STATES = ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"];
    if (FAILURE_STATES.includes(status)) {
      console.error("[suno/kie.ai] tarefa falhou", { providerJobId, status, json });
      return { status: "failed" };
    }
    if (status !== "SUCCESS") return { status: "processing" };

    const sunoData: any[] = json?.data?.response?.sunoData ?? [];
    if (sunoData.length < 1) {
      console.error("[suno/kie.ai] SUCCESS mas sunoData vazio", json);
      return { status: "failed" };
    }

    const words = wordsFromLyric(lyricByTaskId.get(providerJobId) ?? "");

    // Só a primeira faixa vira a música entregue (ver aviso no topo do
    // arquivo) — a segunda que a API sempre devolve fica sem uso.
    const track = sunoData[0];
    const durationSeconds = Number(track.duration) || Math.max(20, words.length * 0.4);
    const path = `suno/${providerJobId}-take_1.mp3`;
    await downloadAndStore(track.audio_url, path);

    return {
      status: "ready",
      tracks: [
        {
          variant: "take_1",
          audioUrl: path,
          durationSeconds,
          wordTimestamps: interpolateTimestamps(words, durationSeconds),
        },
      ],
    };
  },
};
