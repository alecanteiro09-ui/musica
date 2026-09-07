"use client";

import { useState, useTransition } from "react";
import { Mic } from "lucide-react";
import { useWizard } from "./WizardProvider";
import { ChoiceGrid } from "@/components/wizard/ChoiceGrid";
import { PromptChips } from "@/components/wizard/PromptChips";
import { VoiceToTextButton } from "@/components/wizard/VoiceToTextButton";
import { createDraftOrder } from "@/lib/actions/orders";
import { cn, formatMXN } from "@/lib/utils";
import { VOICE_CLONE_ADDON_CENTS_MX } from "@/lib/pricing";

const RELATIONSHIPS = [
  { emoji: "💍", label: "Esposa" },
  { emoji: "💍", label: "Esposo" },
  { emoji: "❤️", label: "Novia" },
  { emoji: "❤️", label: "Novio" },
  { emoji: "👩", label: "Mamá" },
  { emoji: "👨", label: "Papá" },
  { emoji: "👵", label: "Abuela" },
  { emoji: "👴", label: "Abuelo" },
  { emoji: "👧", label: "Hija" },
  { emoji: "👦", label: "Hijo" },
  { emoji: "👭", label: "Hermana" },
  { emoji: "👬", label: "Hermano" },
  { emoji: "👧", label: "Nieta" },
  { emoji: "👦", label: "Nieto" },
  { emoji: "🏠", label: "Familia" },
  { emoji: "🫂", label: "Amiga" },
  { emoji: "🫂", label: "Amigo" },
  { emoji: "🐾", label: "Mascota" },
  { emoji: "✨", label: "Otro" },
];

// Además de las ocasiones universales, incluye las fuertes en el calendario
// mexicano — Día de las Madres y XV años no tienen equivalente directo en la
// versión BR (ver plano de expansión).
const OCCASIONS = [
  { emoji: "🎂", label: "Cumpleaños" },
  { emoji: "❤️", label: "Declaración de amor" },
  { emoji: "💒", label: "Boda" },
  { emoji: "🌸", label: "Día de las Madres" },
  { emoji: "👑", label: "XV años" },
  { emoji: "🕊️", label: "En memoria de alguien que se fue" },
  { emoji: "🌟", label: "Homenaje" },
  { emoji: "✨", label: "Solo porque sí" },
];

const GENRES = [
  { emoji: "🎺", label: "Mariachi" },
  { emoji: "🪗", label: "Banda" },
  { emoji: "🪕", label: "Norteño" },
  { emoji: "🎻", label: "Bolero" },
  { emoji: "📖", label: "Corridos" },
  { emoji: "🌴", label: "Cumbia" },
  { emoji: "💕", label: "Pop romántico" },
];

const VOICES = [
  { emoji: "👩", label: "Femenina" },
  { emoji: "👨", label: "Masculina" },
  { emoji: "🎤", label: "Dueto" },
  { emoji: "🎲", label: "Sorpréndeme" },
];

const MOODS = [
  { emoji: "❤️", label: "Romántico" },
  { emoji: "😄", label: "Divertido" },
  { emoji: "🥹", label: "Conmovedor" },
  { emoji: "🎉", label: "Animado" },
];

const STORY_CHIPS = ["cómo nos conocimos", "lo que admiro de ti", "lo que haces por mí", "algo que nunca te dije"];
const DETAIL_CHIPS = ["un apodo chistoso", "una comida favorita", "un lugar especial", "una manía graciosa"];
const CHORUS_CHIPS = ["gracias por...", "nunca te lo dije, pero...", "me enseñaste...", "mientras yo viva..."];

const STEP_COUNT = 12;

export function Wizard() {
  const { answers, setAnswer, step, setStep, reset, markSubmitted, hydrated } = useWizard();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  if (!hydrated) return null;

  function next() {
    setFormError(null);
    setStep(Math.min(STEP_COUNT - 1, step + 1));
  }
  function back() {
    setFormError(null);
    setStep(Math.max(0, step - 1));
  }

  function submit() {
    startTransition(async () => {
      try {
        markSubmitted();
        await createDraftOrder(answers);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "No pudimos crear tu canción ahora. Intenta de nuevo.");
      }
    });
  }

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return answers.relationship.length > 0;
      case 1:
        return answers.nickname.trim().length > 0;
      case 2:
        return answers.occasion.length > 0;
      case 3:
        return answers.genre.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return answers.story.trim().length >= 20;
      case 7:
        return answers.funDetail.trim().length >= 10;
      case 8:
        return true;
      case 9:
        return true;
      case 10:
        return answers.buyerName.trim().length > 0 && /\S+@\S+\.\S+/.test(answers.buyerEmail);
      default:
        return true;
    }
  })();

  return (
    <div className="mx-auto max-w-xl px-6 py-14">
      <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-base-border">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
        />
      </div>

      {step === 0 && (answers.nickname || answers.relationship) && (
        <p className="mb-6 text-center text-xs text-ink-muted">
          Continuando donde te quedaste —{" "}
          <button type="button" onClick={reset} className="underline hover:text-ink">
            empezar un pedido nuevo
          </button>
        </p>
      )}

      {step === 0 && (
        <Step title="¿Para quién es este regalo?">
          <ChoiceGrid options={RELATIONSHIPS} value={answers.relationship} onChange={(v) => setAnswer("relationship", v)} />
        </Step>
      )}

      {step === 1 && (
        <Step title="¿Cómo le dices a esa persona?" subtitle="Como le hablas en el día a día — puede ser un apodo.">
          <input
            autoFocus
            value={answers.nickname}
            onChange={(e) => setAnswer("nickname", e.target.value)}
            placeholder="Pepe, mamá, abuela Rosa..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-lg text-ink outline-none focus:border-accent"
          />
        </Step>
      )}

      {step === 2 && (
        <Step title="¿Cuál es la ocasión?">
          <ChoiceGrid options={OCCASIONS} value={answers.occasion} onChange={(v) => setAnswer("occasion", v)} />
        </Step>
      )}

      {step === 3 && (
        <Step title={`¿Qué estilo va con ${answers.nickname || "esa persona"}?`} subtitle="Es el ambiente de la canción. Se puede cambiar después.">
          <ChoiceGrid options={GENRES} value={answers.genre} onChange={(v) => setAnswer("genre", v)} />
        </Step>
      )}

      {step === 4 && (
        <Step title="¿Quién canta esta canción?">
          <ChoiceGrid
            options={VOICES}
            value={answers.voicePreference === "masculina" ? "Masculina" : answers.voicePreference === "dupla" ? "Dueto" : "Femenina"}
            onChange={(v) => {
              if (v === "Sorpréndeme") {
                setAnswer("voicePreference", Math.random() < 0.5 ? "masculina" : "feminina");
                return;
              }
              setAnswer("voicePreference", v === "Masculina" ? "masculina" : v === "Dueto" ? "dupla" : "feminina");
            }}
          />
          <div className="mt-8 border-t border-base-border pt-6">
            <p className="mb-3 text-xs uppercase tracking-wide text-ink-muted">¿Y el ánimo de la canción? (opcional)</p>
            <div className="flex flex-wrap justify-center gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setAnswer("mood", answers.mood === m.label ? "" : m.label)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    answers.mood === m.label
                      ? "border-accent bg-accent-soft text-ink"
                      : "border-base-border text-ink-muted hover:border-accent-dim"
                  )}
                >
                  <span aria-hidden>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </Step>
      )}

      {step === 5 && (
        <Step
          title="¿Quieres cantar tú mismo(a)?"
          subtitle="Clonamos tu voz de verdad (grabas un fragmento corto) y la canción sale cantada por ti, no por la IA."
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAnswer("wantsCustomVoice", true)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                answers.wantsCustomVoice ? "border-accent bg-accent-soft" : "border-base-border bg-base-soft hover:border-accent-dim"
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                <Mic size={18} />
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">Sí, quiero cantar con mi propia voz</span>
                <span className="block text-xs text-ink-muted">+{formatMXN(VOICE_CLONE_ADDON_CENTS_MX)} en el valor final</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAnswer("wantsCustomVoice", false)}
              className={cn(
                "rounded-xl border p-4 text-left text-sm transition-colors",
                !answers.wantsCustomVoice ? "border-accent bg-accent-soft text-ink" : "border-base-border bg-base-soft text-ink-muted hover:border-accent-dim"
              )}
            >
              No, prefiero la voz de la IA que elegí
            </button>
          </div>
        </Step>
      )}

      {step === 6 && (
        <Step title={`¿Qué es ${answers.nickname || "esa persona"} para ti?`} subtitle="Escribe a tu manera. Entre más real, más única sale la letra.">
          <PromptChips chips={STORY_CHIPS} value={answers.story} onPick={(starter) => setAnswer("story", starter + " ")} />
          <textarea
            autoFocus
            rows={5}
            value={answers.story}
            onChange={(e) => setAnswer("story", e.target.value)}
            placeholder="Ej: nos conocimos en la universidad y desde entonces..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <HelperText length={answers.story.trim().length} min={20} />
          <div className="mt-3">
            <VoiceToTextButton
              lang="es-MX"
              labels={{ listening: "Escuchando... toca para parar", idle: "Prefiero hablar" }}
              onResult={(text) => setAnswer("story", (answers.story ? answers.story + " " : "") + text)}
            />
          </div>
        </Step>
      )}

      {step === 7 && (
        <Step title={`Cuéntame algo curioso sobre ${answers.nickname || "esa persona"}`} subtitle="Una manía, un apodo, una comida. No tiene que sonar bonito, tiene que ser verdad.">
          <PromptChips chips={DETAIL_CHIPS} value={answers.funDetail} onPick={(starter) => setAnswer("funDetail", starter + " ")} />
          <textarea
            autoFocus
            rows={4}
            value={answers.funDetail}
            onChange={(e) => setAnswer("funDetail", e.target.value)}
            placeholder="Ej: hasta a las plantas de la casa les dice 'mi amor'..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <HelperText length={answers.funDetail.trim().length} min={10} />
          <div className="mt-3">
            <VoiceToTextButton
              lang="es-MX"
              labels={{ listening: "Escuchando... toca para parar", idle: "Prefiero hablar" }}
              onResult={(text) => setAnswer("funDetail", (answers.funDetail ? answers.funDetail + " " : "") + text)}
            />
          </div>
        </Step>
      )}

      {step === 8 && (
        <Step title="¿Una frase para el coro?" subtitle="Opcional — pero suele volverse la parte más fuerte de la canción.">
          <PromptChips chips={CHORUS_CHIPS} value={answers.chorusHint} onPick={(starter) => setAnswer("chorusHint", starter + " ")} />
          <textarea
            rows={3}
            value={answers.chorusHint}
            onChange={(e) => setAnswer("chorusHint", e.target.value)}
            placeholder="Ej: gracias por todo..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-ink outline-none focus:border-accent"
          />
        </Step>
      )}

      {step === 9 && (
        <Step title="¿Quieres mencionar otros nombres en la letra?" subtitle="Hijos, nietos, un apodo familiar — lo que tenga sentido. Opcional.">
          <input
            value={answers.namesToInclude}
            onChange={(e) => setAnswer("namesToInclude", e.target.value)}
            placeholder="Ej: Ana y Mateo"
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
          />
          {answers.namesToInclude.trim() && (
            <p className="mt-4 rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-sm italic text-ink-muted">
              "...y nunca olvidar a {answers.namesToInclude}, tal como son"
            </p>
          )}
        </Step>
      )}

      {step === 10 && (
        <Step title="¿A dónde te mandamos tu letra?" subtitle="La letra queda lista en la próxima pantalla. El correo es solo para que no lo pierdas.">
          <div className="flex flex-col gap-3">
            <input
              value={answers.buyerName}
              onChange={(e) => setAnswer("buyerName", e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
            />
            <input
              type="email"
              value={answers.buyerEmail}
              onChange={(e) => setAnswer("buyerEmail", e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
            />
          </div>
        </Step>
      )}

      {step === 11 && (
        <Step title="¿Todo listo?" subtitle="Última revisión antes de escribir la letra.">
          <dl className="divide-y divide-base-border rounded-xl border border-base-border bg-base-soft text-sm">
            {[
              ["Para quién", answers.relationship],
              ["Nombre", answers.nickname],
              ["Ocasión", answers.occasion],
              ["Estilo", answers.genre],
              [
                "Voz",
                answers.wantsCustomVoice
                  ? "la tuya, clonada"
                  : answers.voicePreference === "masculina"
                    ? "Masculina"
                    : answers.voicePreference === "dupla"
                      ? "Dueto"
                      : answers.voicePreference
                        ? "Femenina"
                        : "",
              ],
              ["Ánimo", answers.mood],
              ["Otros nombres", answers.namesToInclude],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-ink">{value || "—"}</dd>
                </div>
              ))}
          </dl>
          {formError && <p className="mt-3 text-sm text-accent">{formError}</p>}
        </Step>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        {step > 0 ? (
          <button type="button" onClick={back} className="text-sm text-ink-muted hover:text-ink">
            Volver
          </button>
        ) : (
          <span />
        )}

        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={next}
            className={cn(
              "rounded-full px-6 py-3 font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]",
              canAdvance
                ? "bg-accent text-on-accent hover:bg-accent-dim"
                : "cursor-not-allowed bg-base-border text-ink-muted hover:scale-100"
            )}
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={submit}
            className="rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
          >
            {isPending ? "Escribiendo tu letra..." : "Escribir mi letra gratis"}
          </button>
        )}
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-2xl italic text-ink md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function HelperText({ length, min }: { length: number; min: number }) {
  const missing = min - length;
  return (
    <p className={cn("mt-2 text-xs", missing > 0 ? "text-ink-muted" : "text-success")}>
      {missing > 0 ? `Escribe un poco más — faltan ${missing} caracteres` : "Perfecto ✓"}
    </p>
  );
}
