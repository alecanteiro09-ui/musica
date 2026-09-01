"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getOrderByBuyerToken } from "./orders";
import { getImageEnhanceProvider } from "@/lib/ai/imageEnhance";
import { getEmailProvider } from "@/lib/email/provider";
import { buildFramedPhotoPdf, isFrameSizeKey, type FrameSizeKey } from "@/lib/pdf/framePdf";

/**
 * Encontra a foto-quadro do pedido (se a pessoa escolheu esse upsell no
 * checkout) — usado na tela de sucesso pra saber se mostra o
 * progresso/download. A linha só existe depois que o pagamento principal
 * confirma (ver lib/payments/confirm.ts) — antes disso não há nada pra achar.
 */
export async function getPhotoPdfForOrder(buyerToken: string): Promise<{ id: string } | null> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.from("photo_pdf_orders").select("id").eq("order_id", bundle.order.id).maybeSingle();
  return data;
}

/** Usado pelo polling do frontend enquanto o QR/geração está na tela. Também é o que dispara a geração assim que o pagamento cai. */
export async function getPhotoPdfOrderStatus(
  photoPdfOrderId: string
): Promise<{ status: string; pdfUrl?: string | null; error?: string | null }> {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("photo_pdf_orders").select("*").eq("id", photoPdfOrderId).maybeSingle();
  if (!row) return { status: "failed", error: "Não encontrado." };

  if (row.status === "paid") {
    await advancePhotoPdfGeneration(row);
    const { data: refreshed } = await supabase.from("photo_pdf_orders").select("status, pdf_path, error").eq("id", photoPdfOrderId).single();
    return { status: refreshed?.status ?? row.status, error: refreshed?.error };
  }

  if (row.status === "generating") {
    await advancePhotoPdfGeneration(row);
    const { data: refreshed } = await supabase.from("photo_pdf_orders").select("status, pdf_path, error").eq("id", photoPdfOrderId).single();
    if (refreshed?.status === "ready" && refreshed.pdf_path) {
      const { data: signed } = await supabase.storage.from("addons").createSignedUrl(refreshed.pdf_path, 3600);
      return { status: "ready", pdfUrl: signed?.signedUrl ?? null };
    }
    return { status: refreshed?.status ?? row.status, error: refreshed?.error };
  }

  if (row.status === "ready" && row.pdf_path) {
    const { data: signed } = await supabase.storage.from("addons").createSignedUrl(row.pdf_path, 3600);
    return { status: "ready", pdfUrl: signed?.signedUrl ?? null };
  }

  return { status: row.status, error: row.error };
}

/**
 * Máquina de estados do addon, avançada por polling (mesmo padrão de
 * checkSongGenerationProgress em orders.ts — sem worker/fila de verdade,
 * cada chamada do frontend empurra um passo adiante):
 *   paid -> dispara o Nano Banana (image_task_id) -> generating
 *   generating -> confirma a imagem pronta -> baixa, monta o PDF, sobe -> ready
 */
async function advancePhotoPdfGeneration(row: {
  id: string;
  order_id: string;
  status: string;
  frame_size: string;
  source_photo_url: string;
  image_task_id: string | null;
}): Promise<void> {
  const supabase = createAdminClient();

  if (row.status === "paid") {
    try {
      const { taskId } = await getImageEnhanceProvider().enhancePhoto({ imageUrl: row.source_photo_url });
      await supabase
        .from("photo_pdf_orders")
        .update({ status: "generating", image_task_id: taskId, error: null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (err) {
      console.error("[photo-pdf] falha ao iniciar geração de imagem", err);
      await supabase.from("photo_pdf_orders").update({ status: "failed", error: "Não deu pra gerar a foto agora." }).eq("id", row.id);
    }
    return;
  }

  if (row.status === "generating" && row.image_task_id) {
    try {
      const enhance = await getImageEnhanceProvider().getEnhanceStatus(row.image_task_id);
      if (enhance.status === "failed") {
        await supabase.from("photo_pdf_orders").update({ status: "failed", error: enhance.error }).eq("id", row.id);
        return;
      }
      if (enhance.status !== "ready" || !enhance.resultUrl) return;

      if (!isFrameSizeKey(row.frame_size)) throw new Error(`Tamanho de quadro inválido: ${row.frame_size}`);

      const imageRes = await fetch(enhance.resultUrl);
      if (!imageRes.ok) throw new Error(`Falha ao baixar imagem gerada (${imageRes.status})`);
      const contentType = imageRes.headers.get("content-type") || "";
      const isPng = contentType.includes("png") || enhance.resultUrl.endsWith(".png");
      const imageBytes = new Uint8Array(await imageRes.arrayBuffer());

      const pdfBytes = await buildFramedPhotoPdf(imageBytes, row.frame_size as FrameSizeKey, isPng);
      const pdfPath = `${row.order_id}/${row.id}.pdf`;
      const imagePath = `${row.order_id}/${row.id}.${isPng ? "png" : "jpg"}`;

      const { error: uploadPdfError } = await supabase.storage
        .from("addons")
        .upload(pdfPath, Buffer.from(pdfBytes), { contentType: "application/pdf", upsert: true });
      if (uploadPdfError) throw new Error(`Falha ao subir PDF: ${uploadPdfError.message}`);

      await supabase.storage
        .from("addons")
        .upload(imagePath, Buffer.from(imageBytes), { contentType: isPng ? "image/png" : "image/jpeg", upsert: true });

      await supabase
        .from("photo_pdf_orders")
        .update({ status: "ready", pdf_path: pdfPath, generated_image_url: imagePath, error: null, updated_at: new Date().toISOString() })
        .eq("id", row.id);

      await sendPhotoPdfEmailSafely(row.order_id, pdfPath);
    } catch (err) {
      console.error("[photo-pdf] falha ao montar o PDF final", err);
      await supabase.from("photo_pdf_orders").update({ status: "failed", error: "Não deu pra montar o PDF final." }).eq("id", row.id);
    }
  }
}

async function sendPhotoPdfEmailSafely(orderId: string, pdfPath: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("buyer_email, buyer_name, recipient_nickname")
      .eq("id", orderId)
      .single();
    if (!order?.buyer_email) return;

    const { data: signed } = await supabase.storage.from("addons").createSignedUrl(pdfPath, 60 * 60 * 24 * 7);
    if (!signed) return;

    await getEmailProvider().sendPhotoPdfReadyEmail({
      toEmail: order.buyer_email,
      buyerName: order.buyer_name || "",
      recipientNickname: order.recipient_nickname || "",
      pdfUrl: signed.signedUrl,
    });
  } catch (err) {
    console.error("[email] falha ao enviar e-mail da foto de quadro", { orderId, err });
  }
}
