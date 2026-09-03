"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getOrderByBuyerToken } from "./orders";

const MAX_PHOTOS = 12;
// Foto de celular moderna passa fácil de 8MB (12MP+ sem compressão forte).
// Bug real encontrado em produção: um upload de iPhone estourava com
// FUNCTION_PAYLOAD_TOO_LARGE (413) antes mesmo de chegar no nosso código —
// é um limite de PLATAFORMA da Vercel pro corpo de uma Serverless Function
// (não configurável via next.config.mjs, que só ajusta o limite do próprio
// Next). Por isso o arquivo não passa mais pelo corpo da Server Action: o
// browser sobe direto pro Supabase Storage usando uma signed upload URL
// (preparePhotoUpload gera a URL, confirmPhotoUpload só registra o
// resultado — ver lib/photos/uploadPhotoFile.ts pro fluxo completo no
// client). Esse limite continua sendo o teto de tamanho aceito.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
};

export interface PreparePhotoUploadInput {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export type PreparePhotoUploadResult =
  | { ok: true; path: string; token: string; contentType: string }
  | { ok: false; error: string };

/** 1ª etapa do upload: valida o pedido/arquivo e devolve uma signed upload URL do Supabase Storage — o arquivo em si sobe direto do browser pro Storage, nunca passa pelo corpo desta Server Action. */
export async function preparePhotoUpload(buyerToken: string, input: PreparePhotoUploadInput): Promise<PreparePhotoUploadResult> {
  try {
    const bundle = await getOrderByBuyerToken(buyerToken);
    if (!bundle) return { ok: false, error: "Pedido não encontrado." };
    const { order, photos } = bundle;

    if (photos.length >= MAX_PHOTOS) return { ok: false, error: `Máximo de ${MAX_PHOTOS} fotos por presente.` };
    if (!input.fileSize) return { ok: false, error: "Nenhuma imagem enviada." };
    if (input.fileSize > MAX_FILE_BYTES) return { ok: false, error: "Imagem muito grande (máx. 15MB)." };

    const supabase = createAdminClient();
    // Alguns navegadores/apps de câmera não preenchem o content-type — sem
    // isso o storage guarda como application/octet-stream e a foto não abre
    // inline em lugar nenhum (baixa como arquivo em vez de mostrar).
    const contentType = input.contentType || "image/jpeg";
    const nameExt = input.fileName.split(".").pop()?.toLowerCase();
    const ext = (nameExt && nameExt.length <= 5 ? nameExt : null) || EXT_BY_MIME[contentType] || "jpg";
    const path = `${order.id}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage.from("photos").createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[photos] falha ao criar signed upload url", { buyerToken, message: error?.message });
      return { ok: false, error: "Não deu pra preparar o envio dessa foto agora. Tenta de novo." };
    }

    return { ok: true, path, token: data.token, contentType };
  } catch (err) {
    console.error("[photos] erro inesperado ao preparar upload", { buyerToken, err });
    return { ok: false, error: "Não deu pra subir essa foto agora. Tenta de novo." };
  }
}

/** 2ª etapa: chamada depois que o browser já subiu o arquivo direto pro Storage — só registra o resultado no pedido. */
export async function confirmPhotoUpload(buyerToken: string, path: string): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  try {
    const bundle = await getOrderByBuyerToken(buyerToken);
    if (!bundle) return { ok: false, error: "Pedido não encontrado." };
    const { order, photos } = bundle;

    if (!path.startsWith(`${order.id}/`)) return { ok: false, error: "Upload inválido." };

    const supabase = createAdminClient();
    const { data: publicUrl } = supabase.storage.from("photos").getPublicUrl(path);

    const { error: insertError } = await supabase.from("order_photos").insert({
      order_id: order.id,
      image_url: publicUrl.publicUrl,
      sort_order: photos.length,
    });
    if (insertError) {
      console.error("[photos] falha ao registrar foto", { buyerToken, message: insertError.message });
      return { ok: false, error: "Não deu pra salvar essa foto agora. Tenta de novo." };
    }

    revalidatePath(`/pedido/${buyerToken}`);
    return { ok: true, imageUrl: publicUrl.publicUrl };
  } catch (err) {
    console.error("[photos] erro inesperado ao confirmar upload", { buyerToken, err });
    return { ok: false, error: "Não deu pra salvar essa foto agora. Tenta de novo." };
  }
}
