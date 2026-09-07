import { notFound } from "next/navigation";
import { getOrderByBuyerToken, resolveTrackUrl } from "@/lib/actions/orders";
import { applyDiscount, computeOrderPriceCents } from "@/lib/pricing";
import { ChorusPicker } from "@/components/mx/order/ChorusPicker";
import { LyricEditor } from "@/components/mx/order/LyricEditor";
import { VoiceRecorder } from "@/components/mx/order/VoiceRecorder";
import { GenerationProgress } from "@/components/mx/order/GenerationProgress";
import { PreviewAndPaywall } from "@/components/mx/order/PreviewAndPaywall";
import { UnlockedSuccess } from "@/components/mx/order/UnlockedSuccess";

export const metadata = { title: "Tu pedido" };
// Nunca optimizar/cachear esta ruta estáticamente — el estado del pedido
// cambia por evento externo (generación de canción, confirmación de pago).
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { token: string } }) {
  const bundle = await getOrderByBuyerToken(params.token);
  if (!bundle) notFound();

  const { order, lyrics, tracks, photos } = bundle;
  const chorusOptions = lyrics.filter((l) => l.kind === "chorus_option");
  const fullLyric = lyrics.find((l) => l.kind === "full_lyric" && l.is_current);

  if (order.status === "draft") {
    return <Centered>Preparando tu canción...</Centered>;
  }

  if (order.status === "lyric_generated" && !fullLyric) {
    return <ChorusPicker buyerToken={order.buyer_token} nickname={order.recipient_nickname ?? ""} options={chorusOptions} />;
  }

  if (order.status === "lyric_generated" && fullLyric && order.wants_custom_voice && order.voice_status !== "ready") {
    return <VoiceRecorder buyerToken={order.buyer_token} voiceStatus={order.voice_status} voiceError={order.voice_error} />;
  }

  if (order.status === "lyric_generated" && fullLyric) {
    return <LyricEditor buyerToken={order.buyer_token} initialLyric={fullLyric.content} />;
  }

  if (order.status === "song_generating") {
    return <GenerationProgress buyerToken={order.buyer_token} />;
  }

  if (order.status === "preview_ready") {
    const previewTrack = tracks.find((t) => t.status === "ready");
    const previewAudioUrl = await resolveTrackUrl(previewTrack?.full_audio_path ?? null);
    return (
      <PreviewAndPaywall
        buyerToken={order.buyer_token}
        nickname={order.recipient_nickname ?? ""}
        priceCents={applyDiscount(computeOrderPriceCents(order.wants_custom_voice, "mx"), order.discount_cents)}
        discountCents={order.discount_cents}
        freePhoto={order.promo_free_photo}
        buyerEmail={order.buyer_email ?? ""}
        lyric={fullLyric?.content ?? ""}
        previewAudioUrl={previewAudioUrl}
        initialWantsPhotoPdf={order.wants_photo_pdf}
        initialPhotoPdfFrameSize={order.photo_pdf_frame_size}
      />
    );
  }

  if (order.status === "paid" || order.status === "delivered") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return (
      <UnlockedSuccess
        orderId={order.id}
        buyerToken={order.buyer_token}
        giftToken={order.gift_token}
        priceCents={order.price_cents}
        buyerEmail={order.buyer_email}
        photos={photos}
        siteUrl={siteUrl}
      />
    );
  }

  return <Centered>Algo salió mal con este pedido. Escríbenos a contacto@versounicogift.online.</Centered>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md px-6 py-24 text-center text-ink-muted">{children}</div>;
}
