"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { createCardCharge } from "@/lib/actions/payments";
import { getPaymentStatus } from "@/lib/actions/payments";

const CPF_ONLY_DIGITS = (v: string) => v.replace(/\D/g, "");

/**
 * Coleta os dados extras que o cartão exige (Woovi Parcelado, ver
 * lib/payments/woovi.ts) e depois manda o cliente pro checkout hospedado
 * pela própria Woovi — o número do cartão nunca passa pelo nosso servidor.
 * Confirma sozinho pelo mesmo webhook do Pix (mesmo correlationId).
 */
export function CardCheckout({ buyerToken, priceCents }: { buyerToken: string; priceCents: number }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "waiting">("form");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taxID, setTaxID] = useState("");
  const [phone, setPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    if (step !== "waiting") return;
    const poll = setInterval(async () => {
      const { status } = await getPaymentStatus(buyerToken);
      if (status === "paid" || status === "delivered") {
        clearInterval(poll);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [step, buyerToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanTaxID = CPF_ONLY_DIGITS(taxID);
    if (cleanTaxID.length !== 11 && cleanTaxID.length !== 14) {
      setError("Digite um CPF ou CNPJ válido.");
      return;
    }
    if (!phone.trim() || !zipcode.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      setError("Preenche todos os campos — a Woovi exige pra pagamento com cartão.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCardCharge(buyerToken, {
        taxID: cleanTaxID,
        phone: phone.trim(),
        address: { zipcode: zipcode.trim(), street: street.trim(), number: number.trim(), neighborhood: neighborhood.trim(), city: city.trim(), state: state.trim() },
      });
      setPaymentLinkUrl(result.paymentLinkUrl);
      window.open(result.paymentLinkUrl, "_blank", "noopener,noreferrer");
      setStep("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra gerar o checkout de cartão agora.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "waiting") {
    return (
      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-base-border bg-base-soft p-6 text-center">
        <CreditCard size={28} className="text-accent" />
        <p className="text-sm text-ink">Abrimos o checkout seguro da Woovi numa aba nova.</p>
        <p className="text-xs text-ink-muted">Assim que o pagamento de {formatBRL(priceCents)} confirmar, essa tela libera sozinha.</p>
        {paymentLinkUrl && (
          <a href={paymentLinkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
            <ExternalLink size={12} /> Reabrir o checkout
          </a>
        )}
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <Loader2 size={12} className="animate-spin" /> Aguardando confirmação...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5">
      <p className="text-xs text-ink-muted">A Woovi exige esses dados pra liberar pagamento com cartão.</p>
      <input value={taxID} onChange={(e) => setTaxID(e.target.value)} placeholder="CPF" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone (com DDD)" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
      <div className="grid grid-cols-2 gap-2">
        <input value={zipcode} onChange={(e) => setZipcode(e.target.value)} placeholder="CEP" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
        <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
      </div>
      <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
      <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
      <div className="grid grid-cols-2 gap-2">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
        <input value={state} onChange={(e) => setState(e.target.value)} placeholder="UF" maxLength={2} className="rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm uppercase text-ink outline-none focus:border-accent" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-base transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        Ir pro pagamento — {formatBRL(priceCents)}
      </button>
    </form>
  );
}
