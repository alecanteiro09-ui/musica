"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getOrderByBuyerToken } from "./orders";

const MAX_PHOTOS = 12;
// Foto de celular moderna passa fácil de 8MB (12MP+ sem compressão forte) —
// bug real encontrado em produção: uploads reais estouravam o limite padrão
// de 1MB do Next pra Server Actions (ver experimental.serverActions no
// next.config.mjs) antes mesmo de chegar aqui. Com isso corrigido, o limite
// da aplicação em si pode ser bem mais folgado.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
};

/** Sobe uma foto pro presente (bucket público "photos") — usado tanto no checkout (foto do quadro) quanto na tela de sucesso, depois do pagamento. */
export async function uploadOrderPhoto(buyerToken: string, formData: FormData): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  try {
    const bundle = await getOrderByBuyerToken(buyerToken);
    if (!bundle) return { ok: false, error: "Pedido não encontrado." };
    const { order, photos } = bundle;

    if (photos.length >= MAX_PHOTOS) return { ok: false, error: `Máximo de ${MAX_PHOTOS} fotos por presente.` };

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Nenhuma imagem enviada." };
    if (file.size > MAX_FILE_BYTES) return { ok: false, error: "Imagem muito grande (máx. 15MB)." };

    const supabase = createAdminClient();
    // Alguns navegadores/apps de câmera não preenchem file.type — sem isso
    // o storage guarda como application/octet-stream e a foto não abre
    // inline em lugar nenhum (baixa como arquivo em vez de mostrar).
    const contentType = file.type || "image/jpeg";
    const nameExt = file.name.split(".").pop()?.toLowerCase();
    const ext = (nameExt && nameExt.length <= 5 ? nameExt : null) || EXT_BY_MIME[contentType] || "jpg";
    const path = `${order.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
      contentType,
      upsert: false,
    });
    if (uploadError) {
      console.error("[photos] falha ao subir pro storage", { buyerToken, message: uploadError.message });
      return { ok: false, error: "Não deu pra subir essa foto agora. Tenta de novo." };
    }

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
    console.error("[photos] erro inesperado no upload", { buyerToken, err });
    return { ok: false, error: "Não deu pra subir essa foto agora. Tenta de novo." };
  }
}
