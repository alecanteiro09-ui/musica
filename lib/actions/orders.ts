"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getLyricsProvider } from "@/lib/ai/lyrics";
import { getMusicProvider } from "@/lib/ai/music";
import { getEmailProvider } from "@/lib/email/provider";
import { computeOrderPriceCents } from "@/lib/pricing";
import type { Order, OrderLyric, OrderPhoto, OrderStatus, OrderTrack, WizardAnswers } from "@/types";

export interface OrderBundle {
  order: Order;
  lyrics: OrderLyric[];
  tracks: OrderTrack[];
  photos: OrderPhoto[];
}

/** Busca o pedido pelo token privado do comprador. Não confia em RLS pública — ver migração 0001_init.sql. */
export async function getOrderByBuyerToken(buyerToken: string): Promise<OrderBundle | null> {
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*").eq("buyer_token", buyerToken).single();
  if (!order) return null;

  const [{ data: lyrics }, { data: tracks }, { data: photos }] = await Promise.all([
    supabase.from("order_lyrics").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
    supabase.from("order_tracks").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
    supabase.from("order_photos").select("*").eq("order_id", order.id).order("sort_order", { ascending: true }),
  ]);

  return { order, lyrics: lyrics ?? [], tracks: tracks ?? [], photos: photos ?? [] };
}

/** Cria o pedido a partir das respostas do wizard, gera as 2 opções de refrão e redireciona para o hub do pedido. */
export async function createDraftOrder(answers: WizardAnswers): Promise<void> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_email: answers.buyerEmail,
      buyer_name: answers.buyerName,
      relationship: answers.relationship,
      recipient_nickname: answers.nickname,
      occasion: answers.occasion,
      genre: answers.genre,
      voice_preference: answers.voicePreference,
      story: answers.story,
      fun_detail: answers.funDetail,
      chorus_hint: answers.chorusHint,
      mood: answers.mood || null,
      names_to_include: answers.namesToInclude || null,
      status: "draft",
      price_cents: computeOrderPriceCents(answers.wantsCustomVoice),
      wants_custom_voice: answers.wantsCustomVoice,
    })
    .select()
    .single();

  if (error || !order) throw new Error(`Falha ao criar pedido: ${error?.message}`);

  const { optionA, optionB } = await getLyricsProvider().generateChorusOptions(answers);

  await supabase.from("order_lyrics").insert([
    { order_id: order.id, kind: "chorus_option", content: optionA },
    { order_id: order.id, kind: "chorus_option", content: optionB },
  ]);

  await supabase.from("orders").update({ status: "lyric_generated" }).eq("id", order.id);

  redirect(`/pedido/${order.buyer_token}`);
}

/** Dispara a geração da música completa a partir da letra final (editada ou não). */
export async function startSongGeneration(buyerToken: string, finalLyricText: string): Promise<void> {
  const supabase = createAdminClient();
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const { order, lyrics } = bundle;

  const currentFullLyric = lyrics.find((l) => l.kind === "full_lyric" && l.is_current);
  if (currentFullLyric && currentFullLyric.content !== finalLyricText) {
    await supabase.from("order_lyrics").update({ is_current: false }).eq("id", currentFullLyric.id);
    await supabase.from("order_lyrics").insert({
      order_id: order.id,
      kind: "full_lyric",
      version: currentFullLyric.version + 1,
      content: finalLyricText,
      is_current: true,
      source: "user_edited",
    });
  }

  const { providerJobId } = await getMusicProvider().generateSong({
    orderId: order.id,
    lyric: finalLyricText,
    genre: order.genre ?? "",
    voicePreference: order.voice_preference ?? "",
    mood: order.mood ?? "",
    voiceId: order.wants_custom_voice && order.voice_status === "ready" ? order.voice_id : null,
  });

  const providerName = process.env.MUSIC_PROVIDER || (process.env.MUSIC_API_KEY ? "real" : "mock");
  // Só 1 faixa por pedido — o produto entrega uma música (a do refrão
  // escolhido), não uma escolha entre versões.
  await supabase
    .from("order_tracks")
    .insert([{ order_id: order.id, provider: providerName, provider_job_id: providerJobId, variant: "take_1", status: "processing" }]);

  await supabase.from("orders").update({ status: "song_generating" }).eq("id", order.id);
  revalidatePath(`/pedido/${buyerToken}`);
}

/**
 * Resolve um caminho de áudio em URL tocável. Áudios mock já são uma rota
 * pública (/api/mock-audio/...); áudios reais ficam no bucket privado
 * "tracks" e precisam de signed URL — nunca expostos direto, mesmo depois
 * de pagos, pra manter o padrão de "nada sai sem passar por checagem no servidor".
 */
export async function resolveTrackUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("/api/") || path.startsWith("http")) return path;
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from("tracks").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export interface GiftBundle {
  nickname: string;
  relationship: string;
  occasion: string;
  genre: string;
  lyric: string;
  tracks: { variant: string; audioUrl: string; durationSeconds: number; wordTimestamps: unknown }[];
  photos: { id: string; imageUrl: string }[];
  downloadUrl: string | null;
}

/**
 * Busca os dados da página-presente pública, pelo gift_token. Só retorna
 * algo se status in ('paid','delivered') — um pedido não pago não é
 * acessível por aqui, mesmo sabendo o gift_token. Seleciona só campos
 * não-sensíveis: nunca e-mail/nome do comprador ou dados de pagamento.
 */
export async function getGiftByToken(giftToken: string): Promise<GiftBundle | null> {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, recipient_nickname, relationship, occasion, genre, status")
    .eq("gift_token", giftToken)
    .in("status", ["paid", "delivered"])
    .maybeSingle();

  if (!order) return null;

  const [{ data: lyrics }, { data: tracks }, { data: photos }] = await Promise.all([
    supabase
      .from("order_lyrics")
      .select("content")
      .eq("order_id", order.id)
      .eq("kind", "full_lyric")
      .eq("is_current", true)
      .maybeSingle(),
    supabase.from("order_tracks").select("*").eq("order_id", order.id).eq("status", "ready"),
    supabase.from("order_photos").select("id, image_url").eq("order_id", order.id).order("sort_order"),
  ]);

  const resolvedTracks = await Promise.all(
    ((tracks ?? []) as OrderTrack[]).map(async (t) => ({
      variant: t.variant,
      audioUrl: (await resolveTrackUrl(t.full_audio_path)) ?? "",
      durationSeconds: Number(t.duration_seconds ?? 0),
      wordTimestamps: t.word_timestamps,
    }))
  );

  return {
    nickname: order.recipient_nickname ?? "",
    relationship: order.relationship ?? "",
    occasion: order.occasion ?? "",
    genre: order.genre ?? "",
    lyric: lyrics?.content ?? "",
    tracks: resolvedTracks,
    photos: ((photos ?? []) as { id: string; image_url: string }[]).map((p) => ({ id: p.id, imageUrl: p.image_url })),
    downloadUrl: resolvedTracks[0]?.audioUrl ?? null,
  };
}

/**
 * Manda o link do presente pro e-mail que a pessoa digitar na própria
 * página-presente — útil tanto pra quem comprou (backup, já existe um
 * automático) quanto pra quem RECEBEU o presente e quer guardar o link no
 * próprio e-mail, já que não tem acesso ao e-mail do comprador. Só precisa
 * do gift_token (público) — não expõe nada que a página-presente já não
 * mostre.
 */
export async function sendGiftLinkByEmail(giftToken: string, toEmail: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { ok: false, error: "Digite um e-mail válido." };
  }

  const gift = await getGiftByToken(giftToken);
  if (!gift) return { ok: false, error: "Presente não encontrado." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    await getEmailProvider().sendGiftReadyEmail({
      toEmail,
      buyerName: "",
      recipientNickname: gift.nickname,
      giftUrl: `${siteUrl}/g/${giftToken}`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] falha ao reenviar link do presente pela página pública", { giftToken, err });
    return { ok: false, error: "Não deu pra enviar agora. Tenta de novo em instantes." };
  }
}

/** Chamado pelo polling do GenerationProgress. Consulta o provedor e avança o status quando a música fica pronta. */
export async function checkSongGenerationProgress(buyerToken: string): Promise<{ status: OrderStatus }> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const { order, tracks } = bundle;

  if (order.status !== "song_generating") return { status: order.status };

  const jobId = tracks[0]?.provider_job_id;
  if (!jobId) return { status: order.status };

  const supabase = createAdminClient();
  const result = await getMusicProvider().getGenerationStatus(jobId);

  if (result.status === "failed") {
    await supabase.from("order_tracks").update({ status: "failed" }).eq("order_id", order.id);
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { status: "failed" };
  }

  if (result.status === "ready" && result.tracks) {
    for (const t of result.tracks) {
      await supabase
        .from("order_tracks")
        .update({
          status: "ready",
          full_audio_path: t.audioUrl,
          duration_seconds: t.durationSeconds,
          word_timestamps: t.wordTimestamps ?? null,
        })
        .eq("order_id", order.id)
        .eq("variant", t.variant);
    }
    await supabase.from("orders").update({ status: "preview_ready" }).eq("id", order.id);
    revalidatePath(`/pedido/${buyerToken}`);
    return { status: "preview_ready" };
  }

  return { status: order.status };
}
