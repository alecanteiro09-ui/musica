"use client";

import { useState } from "react";
import { X, Check, Pencil, ImagePlus, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { PHOTO_PDF_ADDON_CENTS } from "@/lib/pricing";
import { FRAME_SIZES, isFrameSizeKey, type FrameSizeKey } from "@/lib/frameSizes";
import { updateBuyerEmail, setPhotoPdfSelection, clearPhotoPdfSelection } from "@/lib/actions/orders";
import { uploadOrderPhoto } from "@/lib/actions/photos";
import { PixCharge } from "./PixCharge";
import { CardCheckout } from "./CardCheckout";

const INCLUDES = [
  "A música completa, do jeito que você escreveu",
  "A página-presente, com fotos e a letra acendendo em karaokê",
  "Link e QR Code prontos pra mandar",
  "O MP3 pra baixar e guardar pra sempre",
];

export function CheckoutModal({
  buyerToken,
  nickname,
  priceCents,
  buyerEmail,
  initialWantsPhotoPdf,
  initialFrameSize,
  onClose,
}: {
  buyerToken: string;
  nickname: string;
  /** Preço base — SEM o upsell de foto-quadro. */
  priceCents: number;
  buyerEmail: string;
  /** Reflete o que já ficou salvo no pedido (ex: a pessoa marcou o quadro, saiu sem pagar e voltou depois) — sem isso o checkbox reabriria desmarcado mesmo já tendo uma foto reservada, e o preço mostrado ficaria errado. */
  initialWantsPhotoPdf: boolean;
  initialFrameSize: string | null;
  onClose: () => void;
}) {
  const [view, setView] = useState<"form" | "paying" | "card">("form");
  const [wantsQuadro, setWantsQuadro] = useState(initialWantsPhotoPdf);
  const [frameSize, setFrameSize] = useState<FrameSizeKey>(
    initialFrameSize && isFrameSizeKey(initialFrameSize) ? initialFrameSize : "20x30"
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(buyerEmail);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPreviewCents = priceCents + (wantsQuadro ? PHOTO_PDF_ADDON_CENTS : 0);
  const finalPriceCents = totalPreviewCents;

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  /** Aplica e-mail/quadro no pedido (preço já sai correto pra qualquer método de pagamento em seguida). */
  async function applySelections() {
    if (wantsQuadro && !photoFile && !initialWantsPhotoPdf) {
      throw new Error("Escolhe uma foto pra gente montar o quadro.");
    }

    if (email !== buyerEmail) {
      const result = await updateBuyerEmail(buyerToken, email);
      if (!result.ok) throw new Error(result.error || "E-mail inválido.");
    }

    if (wantsQuadro && photoFile) {
      const formData = new FormData();
      formData.set("photo", photoFile);
      const upload = await uploadOrderPhoto(buyerToken, formData);
      if (!upload.ok) throw new Error(upload.error);
      const selection = await setPhotoPdfSelection(buyerToken, frameSize, upload.imageUrl);
      if (!selection.ok) throw new Error(selection.error || "Não deu pra reservar a foto do quadro.");
    } else if (!wantsQuadro && initialWantsPhotoPdf) {
      await clearPhotoPdfSelection(buyerToken);
    }
  }

  async function handleGeneratePix() {
    setError(null);
    setSubmitting(true);
    try {
      await applySelections();
      setView("paying");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra gerar o Pix agora.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWantCard() {
    setError(null);
    setSubmitting(true);
    try {
      await applySelections();
      setView("card");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra continuar agora.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={view === "form" ? onClose : undefined}
    >
      <div
        className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-base p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">seu pedido</p>
            <h2 className="mt-1 font-display text-xl italic text-ink">Uma música pra {nickname || "alguém especial"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-1 text-ink-muted hover:bg-base-soft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {view === "form" ? (
          <>
            <ul className="mt-5 space-y-2 rounded-xl bg-base-soft p-4 text-sm text-ink">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-center font-display text-3xl text-ink">{formatBRL(totalPreviewCents)}</p>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-base-border bg-base-soft px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-ink-muted">Enviamos pra</p>
                {editingEmail ? (
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEditingEmail(false)}
                    className="mt-0.5 w-full border-b border-accent bg-transparent text-ink outline-none"
                  />
                ) : (
                  <p className="truncate font-medium text-ink">{email}</p>
                )}
              </div>
              {!editingEmail && (
                <button type="button" onClick={() => setEditingEmail(true)} className="flex shrink-0 items-center gap-1 text-xs text-accent hover:underline">
                  <Pencil size={12} /> trocar
                </button>
              )}
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-base-border p-4">
              <input
                type="checkbox"
                checked={wantsQuadro}
                onChange={(e) => setWantsQuadro(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">Levar o quadro pra imprimir</span>
                  <span className="text-sm font-medium text-accent">+{formatBRL(PHOTO_PDF_ADDON_CENTS)}</span>
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  A foto tratada por IA, no tamanho certo pra emoldurar. Sai no mesmo Pix.
                </span>
              </span>
            </label>

            {wantsQuadro && (
              <div className="mt-3 space-y-3 rounded-xl bg-base-soft p-4">
                <label className="flex items-center gap-3">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-base-border bg-base">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus size={20} className="text-ink-muted" />
                    )}
                  </span>
                  <span className="text-sm text-ink-muted">{photoFile ? "Trocar foto" : "Escolher foto"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                </label>

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FRAME_SIZES) as FrameSizeKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFrameSize(key)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        frameSize === key ? "border-accent bg-accent text-on-accent" : "border-base-border text-ink-muted"
                      }`}
                    >
                      {FRAME_SIZES[key].label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <button
              type="button"
              onClick={handleGeneratePix}
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Gerar meu Pix
            </button>

            <button
              type="button"
              onClick={handleWantCard}
              disabled={submitting}
              className="mt-3 w-full text-center text-sm text-ink-muted underline decoration-dotted hover:text-ink disabled:opacity-60"
            >
              Prefere cartão, ou quer parcelar?
            </button>

            <p className="mt-3 text-center text-xs text-ink-muted">Garantia de 7 dias · reembolso sem perguntas</p>
          </>
        ) : view === "card" ? (
          <CardCheckout buyerToken={buyerToken} priceCents={finalPriceCents} />
        ) : (
          <PixCharge buyerToken={buyerToken} priceCents={finalPriceCents} />
        )}
      </div>
    </div>
  );
}
