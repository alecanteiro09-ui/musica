import type { EnhancePhotoInput, EnhanceStatus, ImageEnhanceProvider } from "../imageEnhance";

const KIE_BASE = "https://api.kie.ai/api/v1";

const ENHANCE_PROMPT =
  "Transform this photo into a beautiful, professional portrait suitable for printing and framing: " +
  "soft studio lighting, warm elegant tones, clean uncluttered background, high detail, natural skin texture. " +
  "Keep every person's face, identity and likeness fully recognizable and unchanged — do not alter who they are. " +
  "No text, no watermark, no added objects.";

function authHeaders(): Record<string, string> {
  const apiKey = process.env.MUSIC_API_KEY;
  if (!apiKey) throw new Error("MUSIC_API_KEY não configurado.");
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

export const realImageEnhanceProvider: ImageEnhanceProvider = {
  async enhancePhoto(input: EnhancePhotoInput) {
    const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        model: "nano-banana-2",
        input: {
          prompt: ENHANCE_PROMPT,
          image_input: [input.imageUrl],
          aspect_ratio: "3:4",
          resolution: "2K",
          output_format: "png",
        },
      }),
    });
    if (!res.ok) throw new Error(`Falha ao iniciar geração de imagem (${res.status}): ${await res.text()}`);
    const json = await res.json();
    const taskId = json?.data?.taskId;
    if (!taskId) throw new Error(`Resposta sem taskId: ${JSON.stringify(json)}`);
    return { taskId };
  },

  async getEnhanceStatus(taskId: string): Promise<EnhanceStatus> {
    const res = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${taskId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Falha ao consultar tarefa de imagem (${res.status}): ${await res.text()}`);
    const json = await res.json();
    const state: string = json?.data?.state ?? "";

    if (state === "fail") {
      return { status: "failed", error: json?.data?.failMsg || "Não deu pra gerar a foto agora." };
    }
    if (state === "success") {
      let resultUrl: string | undefined;
      try {
        const parsed = JSON.parse(json.data.resultJson);
        resultUrl = parsed?.resultUrls?.[0];
      } catch {
        // resultJson malformado — tratado como falha abaixo
      }
      if (!resultUrl) return { status: "failed", error: "Resposta sem imagem gerada." };
      return { status: "ready", resultUrl };
    }
    return { status: "pending" };
  },
};
