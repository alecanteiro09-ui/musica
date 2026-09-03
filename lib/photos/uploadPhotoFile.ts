import { createClient } from "@/lib/supabase/client";
import { preparePhotoUpload, confirmPhotoUpload } from "@/lib/actions/photos";

/**
 * Sobe uma foto pro presente. Só para uso no browser (Client Components) —
 * o arquivo vai direto do browser pro Supabase Storage via signed upload
 * URL, sem passar pelo corpo de nenhuma Server Action (ver comentário em
 * lib/actions/photos.ts sobre o limite de payload da Vercel).
 */
export async function uploadPhotoFile(buyerToken: string, file: File): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string }> {
  const prep = await preparePhotoUpload(buyerToken, {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
  if (!prep.ok) return prep;

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .uploadToSignedUrl(prep.path, prep.token, file, { contentType: prep.contentType });
  if (uploadError) {
    console.error("[photos] falha ao subir pro storage", { buyerToken, message: uploadError.message });
    return { ok: false, error: "Não deu pra subir essa foto agora. Tenta de novo." };
  }

  return confirmPhotoUpload(buyerToken, prep.path);
}
