import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-base-border py-10">
      <div className="mx-auto max-w-5xl px-6 text-sm text-ink-muted">
        <Logo />
        <p className="mt-3">
          Cada música é composta a partir da história que você conta. Pagamento único, sem mensalidade.
        </p>

        <div className="mt-6 flex flex-col gap-3 border-t border-base-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            LVC DIGITAL LTDA · CNPJ 41.949.006/0001-97 ·{" "}
            <a href="mailto:contato@versounicogift.online" className="underline decoration-dotted hover:text-ink">
              contato@versounicogift.online
            </a>
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/termos" className="underline decoration-dotted hover:text-ink">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="underline decoration-dotted hover:text-ink">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
