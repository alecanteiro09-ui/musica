import { mockImageEnhanceProvider } from "./providers/mock-image-enhance";
import { realImageEnhanceProvider } from "./providers/real-image-enhance";

export interface EnhancePhotoInput {
  imageUrl: string;
}

export interface EnhanceStatus {
  status: "pending" | "ready" | "failed";
  resultUrl?: string;
  error?: string;
}

/**
 * Transforma a foto que o cliente subiu numa versão bonita/profissional pra
 * imprimir (upsell "foto de quadro"). Usa o Nano Banana 2 (Google, via
 * Kie.ai — mesma conta/chave do MUSIC_API_KEY) em modo image-to-image.
 * Testado manualmente: POST /api/v1/jobs/createTask (model "nano-banana-2",
 * input.image_input com a URL da foto), depois poll em
 * GET /api/v1/jobs/recordInfo?taskId=X — ~12 créditos por imagem, ~2-3min.
 */
export interface ImageEnhanceProvider {
  enhancePhoto(input: EnhancePhotoInput): Promise<{ taskId: string }>;
  getEnhanceStatus(taskId: string): Promise<EnhanceStatus>;
}

export function getImageEnhanceProvider(): ImageEnhanceProvider {
  const forced = process.env.MUSIC_PROVIDER;
  if (forced === "mock") return mockImageEnhanceProvider;
  if (forced && forced !== "mock") return realImageEnhanceProvider;
  return process.env.MUSIC_API_KEY ? realImageEnhanceProvider : mockImageEnhanceProvider;
}
