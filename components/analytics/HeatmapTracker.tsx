"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_ID_KEY = "vu_vid";
const SESSION_ID_KEY = "vu_sid";
const FLUSH_INTERVAL_MS = 15000;
const DWELL_TICK_MS = 2000;
const MAX_CLICKS_PER_PAGE = 50;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateId(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const fresh = uuid();
    storage.setItem(key, fresh);
    return fresh;
  } catch {
    return uuid();
  }
}

function deviceType(): string {
  return window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
}

function scrollBand(pct: number): string {
  return String(Math.min(90, Math.floor(pct / 10) * 10));
}

function sendBeaconOrFetch(payload: unknown) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/site-analytics", blob);
      if (ok) return;
    }
    fetch("/api/site-analytics", { method: "POST", body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  } catch {
    // nunca deixa um erro de rastreamento vazar pra experiência do site
  }
}

/**
 * Coleta dados de navegação (visitante, clique, profundidade de rolagem)
 * pro painel /admin — nunca interfere no site: ouvintes passivos, nenhum
 * `await`, nenhum render, envio sempre fire-and-forget (sendBeacon/fetch
 * keepalive). Módulo isolado dos pixels de anúncio (components/analytics/
 * Pixels.tsx, lib/tracking/*) — um bug aqui não pode derrubar aquilo.
 * Não roda em /admin, pra não misturar a navegação do próprio admin nos dados.
 */
export function HeatmapTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (typeof window === "undefined") return;

    const pageViewId = uuid();
    const visitorId = getOrCreateId(window.localStorage, VISITOR_ID_KEY);
    const sessionId = getOrCreateId(window.sessionStorage, SESSION_ID_KEY);
    const device = deviceType();
    const startedAt = Date.now();
    const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);

    let maxScrollPct = 0;
    const dwellMs: Record<string, number> = {};
    const pendingClicks: { xPct: number; yPct: number }[] = [];
    let ticking = false;

    sendBeaconOrFetch({
      type: "view",
      id: pageViewId,
      visitorId,
      sessionId,
      path: pathname,
      referrer: document.referrer || null,
      utm: {
        source: searchParams.get("utm_source"),
        medium: searchParams.get("utm_medium"),
        campaign: searchParams.get("utm_campaign"),
      },
      deviceType: device,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
      docHeight,
    });

    function currentScrollPct(): number {
      const scrollable = docHeight - window.innerHeight;
      if (scrollable <= 0) return 100;
      return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        maxScrollPct = Math.max(maxScrollPct, currentScrollPct());
        ticking = false;
      });
    }

    function onClick(e: MouseEvent) {
      if (pendingClicks.length >= MAX_CLICKS_PER_PAGE) return;
      pendingClicks.push({
        xPct: Math.round((e.clientX / window.innerWidth) * 10000) / 100,
        yPct: Math.round(((e.clientY + window.scrollY) / docHeight) * 10000) / 100,
      });
    }

    const dwellTimer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const band = scrollBand(currentScrollPct());
      dwellMs[band] = (dwellMs[band] || 0) + DWELL_TICK_MS;
    }, DWELL_TICK_MS);

    function flush(final: boolean) {
      const clicks = pendingClicks.splice(0, pendingClicks.length);
      if (!final && clicks.length === 0 && maxScrollPct === 0) return;
      sendBeaconOrFetch({
        type: "update",
        id: pageViewId,
        maxScrollPct,
        timeOnPageMs: Date.now() - startedAt,
        scrollDwellMs: dwellMs,
        clicks,
      });
    }

    const flushTimer = window.setInterval(() => flush(false), FLUSH_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush(true);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", () => flush(true));

    return () => {
      flush(true);
      window.clearInterval(dwellTimer);
      window.clearInterval(flushTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
