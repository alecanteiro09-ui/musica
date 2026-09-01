"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getOrderByBuyerToken } from "./orders";
import { getVoiceCloneProvider } from "@/lib/ai/voiceClone";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
// Kie.ai busca o áudio via GET simples — sem header de auth — então usamos
// signed URL de curta duração do bucket privado "voice-samples" (mesmo
// padrão de resolveTrackUrl em orders.ts, aplicado a um dado mais sensível).
const SIGNED_URL_TTL_SECONDS = 900;

async function uploadSampleAndSign(orderId: string, file: File, kind: "sample" | "reading"): Promise<string> {
  const supabase = createAdminClient();
  const ext = (file.type.split("/")[1] || "webm").split(";")[0];
  const path = `${orderId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("voice-samples").upload(path, file, {
    contentType: file.type || "audio/webm",
    upsert: true,
  });
  if (error) throw new Error(`Falha ao subir áudio: ${error.message}`);

  const { data, error: signError } = await supabase.storage.from("voice-samples").createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signError || !data) throw new Error(`Falha ao gerar link do áudio: ${signError?.message}`);
  return data.signedUrl;
}

/** Passo 1: sobe a amostra cantando e inicia a validação — recebe uma frase pra ler de volta. */
export async function startVoiceSample(buyerToken: string, formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) return { ok: false, error: "Pedido não encontrado." };
  const { order } = bundle;

  const file = formData.get("audio");
  if (!(file instanceof File)) return { ok: false, error: "Nenhum áudio enviado." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "Áudio muito grande (máx. 15MB)." };

  const supabase = createAdminClient();
  try {
    const signedUrl = await uploadSampleAndSign(order.id, file, "sample");
    const { taskId } = await getVoiceCloneProvider().startValidation({ voiceUrl: signedUrl });
    await supabase
      .from("orders")
      .update({ voice_status: "awaiting_phrase", voice_task_id: taskId, voice_error: null, updated_at: new Date().toISOString() })
      .eq("id", order.id);
  } catch (err) {
    console.error("[voice-clone] falha ao iniciar validação", err);
    const message = "Não deu pra processar essa gravação. Tenta gravar de novo, num lugar mais silencioso.";
    await supabase.from("orders").update({ voice_status: "failed", voice_error: message }).eq("id", order.id);
    return { ok: false, error: message };
  }

  revalidatePath(`/pedido/${buyerToken}`);
  return { ok: true };
}

/** Chamado por polling enquanto voice_status='awaiting_phrase' — devolve a frase assim que a Kie.ai terminar de analisar a amostra. */
export async function checkVoicePhrase(buyerToken: string): Promise<{ status: string; phrase?: string; error?: string }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const { order } = bundle;
  if (order.voice_status !== "awaiting_phrase" || !order.voice_task_id) return { status: order.voice_status };

  const info = await getVoiceCloneProvider().getValidationInfo(order.voice_task_id);
  const supabase = createAdminClient();

  if (info.status === "failed") {
    await supabase.from("orders").update({ voice_status: "failed", voice_error: info.error }).eq("id", order.id);
    return { status: "failed", error: info.error };
  }
  if (info.status === "ready") {
    return { status: "awaiting_phrase", phrase: info.phrase };
  }
  return { status: "awaiting_phrase" };
}

/** Passo 2: sobe a gravação lendo a frase — se bater com a amostra original, a voz vira reutilizável. */
export async function submitVoiceReading(buyerToken: string, formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) return { ok: false, error: "Pedido não encontrado." };
  const { order } = bundle;
  if (!order.voice_task_id) return { ok: false, error: "Nenhuma validação pendente. Volta e grava a amostra de novo." };

  const file = formData.get("audio");
  if (!(file instanceof File)) return { ok: false, error: "Nenhum áudio enviado." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "Áudio muito grande (máx. 15MB)." };

  const supabase = createAdminClient();
  try {
    const signedUrl = await uploadSampleAndSign(order.id, file, "reading");
    await getVoiceCloneProvider().submitVerification({
      taskId: order.voice_task_id,
      verifyUrl: signedUrl,
      voiceName: `verso-unico-${order.id.slice(0, 8)}`,
    });
    await supabase.from("orders").update({ voice_status: "processing", voice_error: null }).eq("id", order.id);
  } catch (err) {
    console.error("[voice-clone] falha ao enviar verificação", err);
    return { ok: false, error: "Não deu pra enviar essa gravação. Tenta de novo." };
  }

  revalidatePath(`/pedido/${buyerToken}`);
  return { ok: true };
}

/** Chamado por polling enquanto voice_status='processing' — confirma se a clonagem terminou. */
export async function checkVoiceCloneResult(buyerToken: string): Promise<{ status: string; error?: string }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const { order } = bundle;
  if (order.voice_status !== "processing" || !order.voice_task_id) return { status: order.voice_status };

  const result = await getVoiceCloneProvider().getVoiceRecord(order.voice_task_id);
  const supabase = createAdminClient();

  if (result.status === "ready" && result.voiceId) {
    await supabase.from("orders").update({ voice_status: "ready", voice_id: result.voiceId }).eq("id", order.id);
    revalidatePath(`/pedido/${buyerToken}`);
    return { status: "ready" };
  }
  if (result.status === "failed") {
    await supabase.from("orders").update({ voice_status: "failed", voice_error: result.error }).eq("id", order.id);
    return { status: "failed", error: result.error };
  }
  return { status: "processing" };
}

/** Volta a gravar do zero (amostra ou leitura falhou). */
export async function retryVoiceClone(buyerToken: string): Promise<void> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const supabase = createAdminClient();
  await supabase
    .from("orders")
    .update({ voice_status: "none", voice_task_id: null, voice_error: null })
    .eq("id", bundle.order.id);
  revalidatePath(`/pedido/${buyerToken}`);
}

/** Desiste da voz clonada e segue com a voz padrão da IA, sem travar o pedido. */
export async function skipVoiceClone(buyerToken: string): Promise<void> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const supabase = createAdminClient();
  await supabase
    .from("orders")
    .update({ wants_custom_voice: false, voice_status: "none", voice_task_id: null, voice_error: null })
    .eq("id", bundle.order.id);
  revalidatePath(`/pedido/${buyerToken}`);
}
