"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const CTA_SHADOW = "shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)]";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMx = pathname?.startsWith("/mx");

  const home = isMx ? "/mx" : "/";
  const howItWorks = isMx ? "/mx#como-funciona" : "/#como-funciona";
  const create = isMx ? "/mx/criar" : "/criar";
  const labels = isMx
    ? { howItWorks: "Cómo funciona", create: "Crear mi canción", createShort: "Crear", openMenu: "Abrir menú", closeMenu: "Cerrar menú" }
    : { howItWorks: "Como funciona", create: "Criar minha música", createShort: "Criar", openMenu: "Abrir menu", closeMenu: "Fechar menu" };

  return (
    <>
      <div
        className="h-[3px] w-full bg-gradient-to-r from-accent via-wax to-accent bg-[length:200%_100%] animate-[gradient-pan_8s_ease-in-out_infinite]"
        aria-hidden
      />
      <header className="sticky top-0 z-50 border-b border-base-border/70 bg-base/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={home} className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-ink-muted sm:flex">
            <Link href={howItWorks} className="transition-colors hover:text-ink">
              {labels.howItWorks}
            </Link>
            {!isMx && (
              <Link href="/minhas-musicas" className="transition-colors hover:text-ink">
                Minhas músicas
              </Link>
            )}
            <Link
              href={create}
              className={`rounded-full bg-accent px-5 py-2.5 font-medium text-on-accent transition-all hover:scale-105 hover:bg-accent-dim active:scale-95 ${CTA_SHADOW}`}
            >
              {labels.create}
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:hidden">
            <Link
              href={create}
              className={`whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-transform active:scale-95 ${CTA_SHADOW}`}
            >
              {labels.createShort}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? labels.closeMenu : labels.openMenu}
              aria-expanded={open}
              className="text-ink"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-base-border bg-base px-6 py-3 sm:hidden">
            <Link
              href={howItWorks}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-ink-muted"
            >
              {labels.howItWorks}
            </Link>
            {!isMx && (
              <Link
                href="/minhas-musicas"
                onClick={() => setOpen(false)}
                className="block py-2 text-sm text-ink-muted"
              >
                Minhas músicas
              </Link>
            )}
          </nav>
        )}
      </header>
    </>
  );
}
