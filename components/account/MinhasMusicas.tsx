"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Music2, LogOut } from "lucide-react";
import { requestLoginCode, verifyLoginCode, getMyOrders, logout, type MyOrderSummary } from "@/lib/actions/auth";

const STATUS_LABEL: Record<string, string> = {
  draft: "Preparando",
  lyric_generated: "Escrevendo a letra",
  song_generating: "Gravando a música",
  preview_ready: "Aguardando pagamento",
  paid: "Pronta",
  delivered: "Pronta",
  failed: "Algo deu errado",
  expired: "Expirado",
};

type Step = "loading" | "email" | "code" | "list";

export function MinhasMusicas() {
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [orders, setOrders] = useState<MyOrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyOrders().then((result) => {
      if (result) {
        setEmail(result.email);
        setOrders(result.orders);
        setStep("list");
      } else {
        setStep("email");
      }
    });
  }, []);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestLoginCode(email);
      if (result.ok) setStep("code");
      else setError(result.error || "Não deu pra enviar o código agora.");
    });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyLoginCode(email, code);
      if (!result.ok) {
        setError(result.error || "Código inválido.");
        return;
      }
      const mine = await getMyOrders();
      if (mine) {
        setOrders(mine.orders);
        setStep("list");
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
      setEmail("");
      setCode("");
      setOrders([]);
      setStep("email");
    });
  }

  if (step === "loading") {
    return (
      <div className="flex justify-center py-10 text-ink-muted">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (step === "email") {
    return (
      <form onSubmit={submitEmail} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
        />
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Enviar código de acesso
        </button>
      </form>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} className="flex flex-col gap-3">
        <p className="text-center text-sm text-ink-muted">
          Mandamos um código de 6 dígitos pra <strong className="text-ink">{email}</strong>. Ele vale por 10 minutos.
        </p>
        <input
          type="text"
          inputMode="numeric"
          required
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-2xl tracking-[0.4em] text-ink outline-none focus:border-accent"
        />
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Confirmar
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
          className="text-center text-xs text-ink-muted underline hover:text-ink"
        >
          Usar outro e-mail
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          Logado como <strong className="text-ink">{email}</strong>
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-base-border py-10 text-center text-sm text-ink-muted">
          Nenhum pedido encontrado com esse e-mail.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.buyerToken} className="flex items-center justify-between gap-3 rounded-xl border border-base-border bg-base-soft p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Music2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{o.recipientNickname || "Sem nome"}</p>
                  <p className="text-xs text-ink-muted">{STATUS_LABEL[o.status] ?? o.status}</p>
                </div>
              </div>
              <Link
                href={o.giftToken ? `/g/${o.giftToken}` : `/pedido/${o.buyerToken}`}
                className="shrink-0 rounded-full border border-base-border px-4 py-2 text-xs text-ink transition-colors hover:border-accent-dim"
              >
                {o.giftToken ? "Abrir" : "Continuar"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
