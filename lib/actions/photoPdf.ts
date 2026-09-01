"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getOrderByBuyerToken } from "./orders";
import { getPaymentProvider } from "@/lib/payments/provider";
import { getImageEnhanceProvider } from "@/lib/ai/imageEnhance";
import { getEmailProvider } from "@/lib/email/provider";
import { PHOTO_PDF_ADDON_CENTS } from "@/lib/pricing";
import { buildFramedPhotoPdf, isFrameSizeKey, type FrameSizeKey } from "@/lib/pdf/framePdf";

/** Cria o pedido do addon (foto de quadro) e a cobrança Pix separada — compra feita depois que a música já foi paga. */
export async function createPhotoPdfOrder(
  buyerToken: string,
  frameSize: string,
  sourcePhotoUrl: string
): Promise<{ ok: true; photoPdfOrderId: string; brCode: string; qrCodeImageUrl: string } | { ok: false; error: string }> {
  if (!isFrameSizeKey(frameSize)) return { ok: false, error: "Tamanho inválido." };

  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) return { ok: false, error: "Pedido não encontrado." };
  const { order } = bundle;
  if (order.status !== "paid" && order.status !== "delivered") {
    return { ok: false, error: "Finaliza o pagamento da música primeiro." };
  }

  const supabase = createAdminClient();
  const { data: row, error: insertError } = await supabase
    .from("photo_pdf_orders")
    .insert({ order_id: order.id, frame_size: frameSize, source_photo_url: sourcePhotoUrl, amount_cents: PHOTO_PDF_ADDON_CENTS })
    .select("id")
    .single();
  if (insertError || !row) return { ok: false, error: "Não deu pra criar o pedido da foto agora." };

  const correlationId = `photopdf:${row.id}`;
  try {
    const charge = await getPaymentProvider().createPixCharge({
      orderId: order.id,
      correlationId,
      amountCents: PHOTO_PDF_ADDON_CENTS,
      comment: `Verso Único — foto de quadro (${frameSize})`,
      customer: { name: order.buyer_name ?? "Comprador", email: order.buyer_email ?? "" },
    });

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: process.env.PAYMENT_PROVIDER || (process.env.WOOVI_APP_ID ? "woovi" : "mock"),
      correlation_id: correlationId,
      charge_id: charge.chargeId,
      status: "pix_generated",
      amount_cents: PHOTO_PDF_ADDON_CENTS,
      pix_qrcode_image_url: charge.qrCodeImageUrl,
      pix_copy_paste: charge.brCode,
    });

    return { ok: true, photoPdfOrderId: row.id, brCode: charge.brCode, qrCodeImageUrl: charge.qrCodeImageUrl };
  } catch (err) {
    console.error("[photo-pdf] falha ao criar cobrança", err);
    return { ok: false, error: "Não deu pra gerar o Pix agora." };
  }
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
