import { NextRequest, NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/tracking/provider";
import type { TrackEventName } from "@/lib/tracking/provider";

interface TrackRequestBody {
  eventName: TrackEventName;
  eventId: string;
  url: string;
  email?: string;
  phone?: string;
  externalId?: string;
  valueCents?: number;
  currency?: string;
  contentName?: string;
  ttclid?: string;
}

/**
 * Recebe eventos de conversão do navegador (fetch com keepalive, ver
 * lib/analytics/track.ts) e repassa pra Meta Conversions API e TikTok
 * Events API — o lado server-side do rastreamento dual pixel+servidor, que
 * não depende de bloqueador de anúncio nem do ITP do Safari no aparelho de
 * quem compra. Sempre responde 200: falha de rede ou credencial ausente num
 * provedor de anúncio nunca pode atrapalhar o fluxo de compra de verdade.
 */
export async function POST(req: NextRequest) {
  let body: TrackRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body?.eventName || !body?.eventId || !body?.url) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;

  try {
    await trackServerEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: body.url,
      clientIp,
      userAgent: req.headers.get("user-agent"),
      fbp: req.cookies.get("_fbp")?.value,
      fbc: req.cookies.get("_fbc")?.value,
      ttp: req.cookies.get("_ttp")?.value,
      ttclid: body.ttclid,
      email: body.email,
      phone: body.phone,
      externalId: body.externalId,
      valueCents: body.valueCents,
      currency: body.currency,
      contentName: body.contentName,
    });
  } catch (err) {
    console.error("[api/track] falha ao repassar evento", err);
  }

  return NextResponse.json({ ok: true });
}
