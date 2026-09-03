import { createAdminClient } from "@/lib/supabase/server";

export interface DashboardData {
  pageviews: { today: number; last7d: number; last30d: number };
  visitors: { today: number; last7d: number; last30d: number };
  avgTimeOnPageMs: number;
  topPaths: { path: string; count: number }[];
  topReferrers: { host: string; count: number }[];
  deviceSplit: { device: string; count: number; pct: number }[];
  dailyTrend: { date: string; count: number }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function hostOf(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

/**
 * Uma query pegando os últimos 30 dias de page_views e agregando tudo em JS
 * — volume desse site não justifica view/RPC separada no Postgres pra isso.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const { data: rows } = await supabase
    .from("page_views")
    .select("visitor_id, path, referrer, device_type, time_on_page_ms, created_at")
    .gte("created_at", since);

  const all = rows ?? [];
  const now = Date.now();

  function within(days: number) {
    return all.filter((r: any) => now - new Date(r.created_at).getTime() <= days * DAY_MS);
  }

  function uniqueVisitors(list: typeof all) {
    return new Set(list.map((r: any) => r.visitor_id)).size;
  }

  const today = within(1);
  const last7d = within(7);
  const last30d = all;

  const pathCounts = new Map<string, number>();
  const hostCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  let timeSum = 0;
  let timeCount = 0;

  for (const row of last30d) {
    pathCounts.set(row.path, (pathCounts.get(row.path) || 0) + 1);
    deviceCounts.set(row.device_type, (deviceCounts.get(row.device_type) || 0) + 1);

    const host = hostOf(row.referrer);
    if (host) hostCounts.set(host, (hostCounts.get(host) || 0) + 1);

    if (row.time_on_page_ms > 0) {
      timeSum += row.time_on_page_ms;
      timeCount += 1;
    }

    const day = row.created_at.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }

  const dailyTrend: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    dailyTrend.push({ date, count: dayCounts.get(date) || 0 });
  }

  const totalDevice = last30d.length || 1;

  return {
    pageviews: { today: today.length, last7d: last7d.length, last30d: last30d.length },
    visitors: {
      today: uniqueVisitors(today),
      last7d: uniqueVisitors(last7d),
      last30d: uniqueVisitors(last30d),
    },
    avgTimeOnPageMs: timeCount > 0 ? Math.round(timeSum / timeCount) : 0,
    topPaths: [...pathCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    topReferrers: [...hostCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([host, count]) => ({ host, count })),
    deviceSplit: [...deviceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([device, count]) => ({ device, count, pct: Math.round((count / totalDevice) * 100) })),
    dailyTrend,
  };
}

export interface HeatmapData {
  paths: string[];
  sampleCount: number;
  clicks: { xPct: number; yPct: number }[];
  scrollBands: { band: number; reachedPct: number; dwellMs: number }[];
  viewport: { w: number; h: number; docHeight: number };
}

/** Paths distintos já rastreados, pro seletor de página do /admin/heatmap. */
export async function getTrackedPaths(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("page_views")
    .select("path")
    .order("created_at", { ascending: false })
    .limit(2000);
  const paths: string[] = (data ?? []).map((r: any) => r.path as string);
  return Array.from(new Set(paths)).sort();
}

export async function getHeatmapData(path: string, device: string): Promise<HeatmapData> {
  const supabase = createAdminClient();

  let viewsQuery = supabase
    .from("page_views")
    .select("id, max_scroll_pct, scroll_dwell_ms, viewport_w, viewport_h, doc_height")
    .eq("path", path);
  if (device !== "all") viewsQuery = viewsQuery.eq("device_type", device);
  const { data: views } = await viewsQuery.limit(5000);

  const rows = views ?? [];
  const sampleCount = rows.length;

  const bandReached = new Map<number, number>();
  const bandDwell = new Map<number, number>();
  let widthSum = 0;
  let heightSum = 0;
  let docHeightSum = 0;
  let dims = 0;

  for (const row of rows) {
    if (row.viewport_w && row.viewport_h) {
      widthSum += row.viewport_w;
      heightSum += row.viewport_h;
      docHeightSum += row.doc_height || row.viewport_h;
      dims += 1;
    }
    for (let band = 0; band <= 90; band += 10) {
      if (row.max_scroll_pct >= band) bandReached.set(band, (bandReached.get(band) || 0) + 1);
    }
    const dwell = (row.scroll_dwell_ms || {}) as Record<string, number>;
    for (const [band, ms] of Object.entries(dwell)) {
      const key = Number(band);
      bandDwell.set(key, (bandDwell.get(key) || 0) + ms);
    }
  }

  const scrollBands = Array.from({ length: 10 }, (_, i) => {
    const band = i * 10;
    const reached = bandReached.get(band) || 0;
    return {
      band,
      reachedPct: sampleCount > 0 ? Math.round((reached / sampleCount) * 100) : 0,
      // Média por quem chegou nessa faixa (não a soma de todo mundo) — senão
      // "9min" pareceria o tempo de UMA pessoa em vez de 95 pessoas somadas.
      dwellMs: reached > 0 ? Math.round((bandDwell.get(band) || 0) / reached) : 0,
    };
  });

  let clicksQuery = supabase.from("page_clicks").select("x_pct, y_pct").eq("path", path);
  if (device !== "all") clicksQuery = clicksQuery.eq("device_type", device);
  const { data: clickRows } = await clicksQuery.limit(5000);

  const paths = await getTrackedPaths();

  return {
    paths,
    sampleCount,
    clicks: (clickRows ?? []).map((c: any) => ({ xPct: Number(c.x_pct), yPct: Number(c.y_pct) })),
    scrollBands,
    viewport: {
      w: dims > 0 ? Math.round(widthSum / dims) : 1280,
      h: dims > 0 ? Math.round(heightSum / dims) : 800,
      docHeight: dims > 0 ? Math.round(docHeightSum / dims) : 1600,
    },
  };
}
