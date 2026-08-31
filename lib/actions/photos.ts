"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getOrderByBuyerToken } from "./orders";

const MAX_PHOTOS = 12;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Sobe uma foto pro presente (bucket público "photos") — usado na tela de sucesso, depois do pagamento. */
export async function uploadOrderPhoto(buyerToken: string, formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) return { ok: false, error: "Pedido não encontrado." };
  const { order, photos } = bundle;

  if (photos.length >= MAX_PHOTOS) return { ok: false, error: `Máximo de ${MAX_PHOTOS} fotos por presente.` };

  const file = formData.get("photo");
  if (!(file instanceof File)) return { ok: false, error: "Nenhuma imagem enviada." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "Imagem muito grande (máx. 8MB)." };

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${order.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from("photos").getPublicUrl(path);

  await supabase.from("order_photos").insert({
    order_id: order.id,
    image_url: publicUrl.publicUrl,
    sort_order: photos.length,
  });

  revalidatePath(`/pedido/${buyerToken}`);
  return { ok: true };
}
