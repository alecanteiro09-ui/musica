import { MinhasMusicas } from "@/components/account/MinhasMusicas";

export const metadata = { title: "Minhas músicas" };
export const dynamic = "force-dynamic";

export default function MinhasMusicasPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">sua conta</p>
      <h1 className="mt-2 text-center font-display text-3xl italic text-ink">Minhas músicas</h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm text-ink-muted">
        Digite o e-mail que você usou na compra pra ver todos os seus pedidos.
      </p>

      <div className="mt-10">
        <MinhasMusicas />
      </div>
    </div>
  );
}
