import type { EnhancePhotoInput, EnhanceStatus, ImageEnhanceProvider } from "../imageEnhance";

const READY_AFTER_MS = 3000;
const jobs = new Map<string, { startedAt: number; sourceUrl: string }>();

export const mockImageEnhanceProvider: ImageEnhanceProvider = {
  async enhancePhoto(input: EnhancePhotoInput) {
    const taskId = `mock_image_${Date.now()}`;
    jobs.set(taskId, { startedAt: Date.now(), sourceUrl: input.imageUrl });
    return { taskId };
  },

  async getEnhanceStatus(taskId: string): Promise<EnhanceStatus> {
    const job = jobs.get(taskId);
    if (!job) return { status: "failed", error: "Tarefa não encontrada." };
    if (Date.now() - job.startedAt < READY_AFTER_MS) return { status: "pending" };
    // Em dev, "melhorar" é só devolver a mesma foto — sem chave real não dá pra gerar de verdade.
    return { status: "ready", resultUrl: job.sourceUrl };
  },
};
