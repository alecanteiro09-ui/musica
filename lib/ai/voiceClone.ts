import { mockVoiceCloneProvider } from "./providers/mock-voice-clone";
import { realVoiceCloneProvider } from "./providers/real-voice-clone";

export interface StartValidationInput {
  voiceUrl: string;
  vocalStartS?: number;
  vocalEndS?: number;
}

export interface ValidationInfo {
  status: "pending" | "ready" | "failed";
  phrase?: string;
  error?: string;
}

export interface SubmitVerificationInput {
  taskId: string;
  verifyUrl: string;
  voiceName: string;
}

export interface VoiceRecordResult {
  status: "pending" | "ready" | "failed";
  voiceId?: string;
  error?: string;
}

/**
 * Clonagem de voz pra cantar a música (upsell "sua voz"). Mesmo provedor
 * (Suno via Kie.ai) da geração normal — ver lib/ai/providers/real-music.ts —
 * mas endpoints próprios, testados manualmente porque não estão documentados
 * de forma completa em docs.kie.ai/suno-api:
 *   1. POST /api/v1/voice/validate    — manda a amostra, recebe taskId
 *   2. GET  /api/v1/voice/validate-info — dá poll até sair a frase de validação
 *   3. POST /api/v1/voice/generate    — manda a gravação da frase lida
 *   4. GET  /api/v1/voice/record-info  — dá poll até sair o voiceId
 * Confirmado por teste real: validação que falha (frase não bate) NÃO
 * cobra crédito — só a clonagem bem-sucedida deve cobrar (custo exato não
 * documentado publicamente).
 */
export interface VoiceCloneProvider {
  startValidation(input: StartValidationInput): Promise<{ taskId: string }>;
  getValidationInfo(taskId: string): Promise<ValidationInfo>;
  submitVerification(input: SubmitVerificationInput): Promise<{ taskId: string }>;
  getVoiceRecord(taskId: string): Promise<VoiceRecordResult>;
}

export function getVoiceCloneProvider(): VoiceCloneProvider {
  const forced = process.env.MUSIC_PROVIDER;
  if (forced === "mock") return mockVoiceCloneProvider;
  if (forced && forced !== "mock") return realVoiceCloneProvider;
  return process.env.MUSIC_API_KEY ? realVoiceCloneProvider : mockVoiceCloneProvider;
}
