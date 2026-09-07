"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * O <html lang> fica declarado uma vez só no layout raiz (app/layout.tsx),
 * compartilhado entre BR e MX — sem isso, toda página /mx ficava marcada
 * como português pra leitores de tela e mecanismos de busca, mesmo com o
 * conteúdo em espanhol.
 */
export function HtmlLangSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = pathname?.startsWith("/mx") ? "es-MX" : "pt-BR";
  }, [pathname]);

  return null;
}
