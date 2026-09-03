import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface ViewPayload {
  type: "view";
  id: string;
  visitorId: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  utm: { source: string | null; medium: string | null; campaign: string | null };
  deviceType: string;
  viewportW: number;
  viewportH: number;
  docHeight: number;
}

interface UpdatePayload {
  type: "update";
  id: string;
  maxScrollPct: number;
  timeOnPageMs: number;
  scrollDwellMs: Record<string, number>;
  clicks: { xPct: number; yPct: number }[];
}

/**
 * Recebe os beacons do HeatmapTracker (components/analytics/HeatmapTracker.tsx)
 * e grava em page_views/page_clicks. Mesmo padrão defensivo do app/api/track:
 * sempre responde 200 rápido, qualquer falha de banco só vira console.error —
 * um problema aqui nunca pode aparecer pro visitante nem travar navegação.
 * sendBeacon manda Content-Type text/plain (não dá pra escolher), então o
 * corpo chega como texto puro em vez de já vir parseado como JSON.
 */
export async function POST(req: NextRequest) {
  let body: ViewPayload | UpdatePayload;
  try {
    const raw = await req.text();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body?.type || !body?.id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    if (body.type === "view") {
      if (!body.path || !body.visitorId || !body.sessionId) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      await supabase.from("page_views").insert({
        id: body.id,
        visitor_id: body.visitorId,
        session_id: body.sessionId,
        path: body.path,
        referrer: body.referrer,
        utm: body.utm,
        device_type: body.deviceType,
        viewport_w: body.viewportW,
        viewport_h: body.viewportH,
        doc_height: body.docHeight,
      });
    } else if (body.type === "update") {
      const { data: pageView } = await supabase
        .from("page_views")
        .select("path, device_type")
        .eq("id", body.id)
        .maybeSingle();
      if (!pageView) return NextResponse.json({ ok: true });

      await supabase
        .from("page_views")
        .update({
          max_scroll_pct: body.maxScrollPct,
          time_on_page_ms: body.timeOnPageMs,
          scroll_dwell_ms: body.scrollDwellMs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id);

      if (Array.isArray(body.clicks) && body.clicks.length > 0) {
        await supabase.from("page_clicks").insert(
          body.clicks.slice(0, 50).map((c) => ({
            page_view_id: body.id,
            path: pageView.path,
            device_type: pageView.device_type,
            x_pct: c.xPct,
            y_pct: c.yPct,
          }))
        );
      }
    }
  } catch (err) {
    console.error("[api/site-analytics] falha ao gravar evento", err);
  }

  return NextResponse.json({ ok: true });
}
