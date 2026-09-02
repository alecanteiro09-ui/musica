"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";

const TTCLID_COOKIE_MAX_AGE_DAYS = 7;

/** Guarda o ttclid (identificador de clique da TikTok) num cookie de 1ª parte, igual a Meta já faz sozinha com o fbclid via _fbc — sem isso, o clique some assim que a pessoa navega pra outra página antes de comprar. */
function captureTtclid(searchParams: URLSearchParams) {
  const ttclid = searchParams.get("ttclid");
  if (!ttclid || typeof document === "undefined") return;
  const maxAge = TTCLID_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `ttclid=${encodeURIComponent(ttclid)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Dispara PageView a cada troca de rota. O App Router não recarrega a
 * página em navegação client-side, então o PageView automático dos pixels
 * de base (que só roda uma vez, no carregamento inicial do script — ver
 * components/analytics/Pixels.tsx) não é suficiente sozinho.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureTtclid(searchParams);
    trackEvent("PageView");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
