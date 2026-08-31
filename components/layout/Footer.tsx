import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-base-border py-10">
      <div className="mx-auto max-w-5xl px-6 text-sm text-ink-muted">
        <Logo />
        <p className="mt-3">
          Cada música é composta a partir da história que você conta. Pagamento único, sem mensalidade.
        </p>
      </div>
    </footer>
  );
}
