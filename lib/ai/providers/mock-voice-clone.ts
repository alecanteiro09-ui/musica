import type {
  StartValidationInput,
  SubmitVerificationInput,
  ValidationInfo,
  VoiceCloneProvider,
  VoiceRecordResult,
} from "../voiceClone";

const MOCK_PHRASE = "O sol se põe atrás da serra e a gente canta essa canção";
const READY_AFTER_MS = 3000;

interface MockJob {
  startedAt: number;
  stage: "validating" | "verifying";
}

const jobs = new Map<string, MockJob>();

export const mockVoiceCloneProvider: VoiceCloneProvider = {
  async startValidation(_input: StartValidationInput) {
    const taskId = `mock_voice_${Date.now()}`;
    jobs.set(taskId, { startedAt: Date.now(), stage: "validating" });
    return { taskId };
  },

  async getValidationInfo(taskId: string): Promise<ValidationInfo> {
    const job = jobs.get(taskId);
    if (!job) return { status: "failed", error: "Tarefa não encontrada." };
    if (Date.now() - job.startedAt < READY_AFTER_MS) return { status: "pending" };
    return { status: "ready", phrase: MOCK_PHRASE };
  },

  async submitVerification(input: SubmitVerificationInput) {
    const job = jobs.get(input.taskId);
    if (job) jobs.set(input.taskId, { ...job, startedAt: Date.now(), stage: "verifying" });
    return { taskId: input.taskId };
  },

  async getVoiceRecord(taskId: string): Promise<VoiceRecordResult> {
    const job = jobs.get(taskId);
    if (!job) return { status: "failed", error: "Tarefa não encontrada." };
    if (Date.now() - job.startedAt < READY_AFTER_MS) return { status: "pending" };
    return { status: "ready", voiceId: `mock_voice_id_${taskId}` };
  },
};
