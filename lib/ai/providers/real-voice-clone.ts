import type {
  StartValidationInput,
  SubmitVerificationInput,
  ValidationInfo,
  VoiceCloneProvider,
  VoiceRecordResult,
} from "../voiceClone";

const KIE_BASE = "https://api.kie.ai/api/v1";

function authHeaders(): Record<string, string> {
  const apiKey = process.env.MUSIC_API_KEY;
  if (!apiKey) throw new Error("MUSIC_API_KEY não configurado.");
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
}

export const realVoiceCloneProvider: VoiceCloneProvider = {
  async startValidation(input: StartValidationInput) {
    const res = await fetch(`${KIE_BASE}/voice/validate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        voiceUrl: input.voiceUrl,
        vocalStartS: input.vocalStartS ?? 0,
        // Janela justa (a gravação no wizard já para sozinha em 12s) — menos
        // áudio pra Kie.ai analisar tende a validar mais rápido.
        vocalEndS: input.vocalEndS ?? 10,
        language: "pt",
      }),
    });
    if (!res.ok) throw new Error(`Falha ao iniciar validação de voz (${res.status}): ${await res.text()}`);
    const json = await res.json();
    const taskId = json?.data?.taskId;
    if (!taskId) throw new Error(`Resposta sem taskId: ${JSON.stringify(json)}`);
    return { taskId };
  },

  async getValidationInfo(taskId: string): Promise<ValidationInfo> {
    const res = await fetch(`${KIE_BASE}/voice/validate-info?taskId=${taskId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Falha ao consultar validação (${res.status}): ${await res.text()}`);
    const json = await res.json();
    const status: string = json?.data?.status ?? "";
    if (status === "wait_validating" && json?.data?.validateInfo) {
      return { status: "ready", phrase: json.data.validateInfo };
    }
    if (status === "processing_validate_fail" || status === "fail") {
      return { status: "failed", error: json?.data?.errorMessage || "Não deu pra validar essa amostra de voz." };
    }
    return { status: "pending" };
  },

  async submitVerification(input: SubmitVerificationInput) {
    const res = await fetch(`${KIE_BASE}/voice/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        taskId: input.taskId,
        verifyUrl: input.verifyUrl,
        voiceName: input.voiceName,
        singerSkillLevel: "beginner",
      }),
    });
    if (!res.ok) throw new Error(`Falha ao enviar gravação de verificação (${res.status}): ${await res.text()}`);
    const json = await res.json();
    const taskId = json?.data?.taskId;
    if (!taskId) throw new Error(`Resposta sem taskId: ${JSON.stringify(json)}`);
    return { taskId };
  },

  async getVoiceRecord(taskId: string): Promise<VoiceRecordResult> {
    const res = await fetch(`${KIE_BASE}/voice/record-info?taskId=${taskId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Falha ao consultar clonagem (${res.status}): ${await res.text()}`);
    const json = await res.json();
    const status: string = json?.data?.status ?? "";
    if (status === "success" && json?.data?.voiceId) {
      return { status: "ready", voiceId: json.data.voiceId };
    }
    if (status === "fail") {
      return { status: "failed", error: json?.data?.errorMessage || "Não deu pra clonar essa voz. Tenta gravar de novo, num lugar mais silencioso." };
    }
    return { status: "pending" };
  },
};
