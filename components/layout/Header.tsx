import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b border-base-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/#como-funciona" className="hover:text-ink">
            Como funciona
          </Link>
          <Link
            href="/criar"
            className="rounded-full bg-accent px-4 py-2 font-medium text-on-accent transition-transform hover:scale-105 hover:bg-accent-dim active:scale-95"
          >
            Criar minha música
          </Link>
        </nav>
      </div>
    </header>
  );
}
