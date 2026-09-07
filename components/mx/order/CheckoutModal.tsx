"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Check, Pencil, ImagePlus, Loader2 } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import { PHOTO_PDF_ADDON_CENTS_MX } from "@/lib/pricing";
import { FRAME_SIZES, isFrameSizeKey, type FrameSizeKey } from "@/lib/frameSizes";
import { updateBuyerEmail, setPhotoPdfSelection, clearPhotoPdfSelection } from "@/lib/actions/orders";
import { uploadPhotoFile } from "@/lib/photos/uploadPhotoFile";
import { StripeCheckout } from "./StripeCheckout";

const INCLUDES = [
  "La canción completa, cantada como tú la elegiste",
  "La página-regalo, con fotos y la letra encendiéndose en karaoke",
  "Enlace y código QR listos para enviar",
  "El MP3 para descargar y guardar para siempre",
];

/**
 * Equivalente MX de CheckoutModal.tsx (Brasil) — más simple porque no hay
 * un paso separado "elegir método de pago": se recogen los datos (correo,
 * upsell de foto) y se pasa directo al checkout de Stripe (solo tarjeta).
 */
export function CheckoutModal({
  buyerToken,
  nickname,
  priceCents,
  freePhoto,
  buyerEmail,
  initialWantsPhotoPdf,
  initialFrameSize,
  onClose,
}: {
  buyerToken: string;
  nickname: string;
  /** Precio base — SIN el upsell de foto enmarcada. */
  priceCents: number;
  freePhoto: boolean;
  buyerEmail: string;
  initialWantsPhotoPdf: boolean;
  initialFrameSize: string | null;
  onClose: () => void;
}) {
  const [view, setView] = useState<"form" | "paying">("form");
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

  const totalPreviewCents = priceCents + (wantsQuadro && !freePhoto ? PHOTO_PDF_ADDON_CENTS_MX : 0);
  const finalPriceCents = totalPreviewCents;

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function applySelections() {
    if (wantsQuadro && !photoFile && !initialWantsPhotoPdf) {
      throw new Error("Elige una foto para armar el cuadro.");
    }

    if (email !== buyerEmail) {
      const result = await updateBuyerEmail(buyerToken, email);
      if (!result.ok) throw new Error(result.error || "Correo inválido.");
    }

    if (wantsQuadro && photoFile) {
      const upload = await uploadPhotoFile(buyerToken, photoFile);
      if (!upload.ok) throw new Error(upload.error);
      const selection = await setPhotoPdfSelection(buyerToken, frameSize, upload.imageUrl);
      if (!selection.ok) throw new Error(selection.error || "No pudimos reservar la foto del cuadro.");
    } else if (!wantsQuadro && initialWantsPhotoPdf) {
      await clearPhotoPdfSelection(buyerToken);
    }
  }

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await applySelections();
      setView("paying");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos continuar ahora.");
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
            <p className="text-xs uppercase tracking-wide text-accent">tu pedido</p>
            <h2 className="mt-1 font-display text-xl italic text-ink">Una canción para {nickname || "alguien especial"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 text-ink-muted hover:bg-base-soft hover:text-ink">
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

            <p className="mt-5 text-center font-display text-3xl text-ink">{formatMXN(totalPreviewCents)}</p>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-base-border bg-base-soft px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-ink-muted">Lo enviamos a</p>
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
                  <Pencil size={12} /> cambiar
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
                  <span className="text-sm font-medium text-ink">Llevar el cuadro para imprimir</span>
                  {freePhoto ? (
                    <span className="text-sm font-medium text-accent">Gratis 🎁</span>
                  ) : (
                    <span className="text-sm font-medium text-accent">+{formatMXN(PHOTO_PDF_ADDON_CENTS_MX)}</span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  La foto tratada por IA, en el tamaño justo para enmarcar. Sale en el mismo pago.
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
                  <span className="text-sm text-ink-muted">{photoFile ? "Cambiar foto" : "Elegir foto"}</span>
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
              onClick={handleContinue}
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Ir a pagar — {formatMXN(finalPriceCents)}
            </button>

            <p className="mt-3 text-center text-xs text-ink-muted">Garantía de 7 días · reembolso sin preguntas</p>
            <p className="mt-2 text-center text-[11px] text-ink-muted">
              Al continuar, aceptas los{" "}
              <Link href="/mx/terminos" target="_blank" className="underline decoration-dotted hover:text-ink">
                Términos de Uso
              </Link>{" "}
              y el{" "}
              <Link href="/mx/privacidad" target="_blank" className="underline decoration-dotted hover:text-ink">
                Aviso de Privacidad
              </Link>
              .
            </p>
          </>
        ) : (
          <StripeCheckout buyerToken={buyerToken} priceCents={finalPriceCents} buyerEmail={email} />
        )}
      </div>
    </div>
  );
}
