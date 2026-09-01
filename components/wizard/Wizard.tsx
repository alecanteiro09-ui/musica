"use client";

import { useState, useTransition } from "react";
import { Mic } from "lucide-react";
import { useWizard } from "./WizardProvider";
import { ChoiceGrid } from "./ChoiceGrid";
import { PromptChips } from "./PromptChips";
import { VoiceToTextButton } from "./VoiceToTextButton";
import { createDraftOrder } from "@/lib/actions/orders";
import { cn, formatBRL } from "@/lib/utils";
import { VOICE_CLONE_ADDON_CENTS } from "@/lib/pricing";

const RELATIONSHIPS = [
  { emoji: "💍", label: "Esposa" },
  { emoji: "💍", label: "Marido" },
  { emoji: "❤️", label: "Namorada" },
  { emoji: "❤️", label: "Namorado" },
  { emoji: "👩", label: "Mãe" },
  { emoji: "👨", label: "Pai" },
  { emoji: "👵", label: "Avó" },
  { emoji: "👴", label: "Avô" },
  { emoji: "👧", label: "Filha" },
  { emoji: "👦", label: "Filho" },
  { emoji: "👭", label: "Irmã" },
  { emoji: "👬", label: "Irmão" },
  { emoji: "👧", label: "Neta" },
  { emoji: "👦", label: "Neto" },
  { emoji: "🏠", label: "Família" },
  { emoji: "🫂", label: "Amiga" },
  { emoji: "🫂", label: "Amigo" },
  { emoji: "🐾", label: "Pet" },
  { emoji: "✨", label: "Outro" },
];

const OCCASIONS = [
  { emoji: "🎂", label: "Aniversário" },
  { emoji: "❤️", label: "Declaração de amor" },
  { emoji: "💒", label: "Casamento" },
  { emoji: "🕊️", label: "Saudade de quem partiu" },
  { emoji: "🌟", label: "Homenagem" },
  { emoji: "✨", label: "Só porque sim" },
];

const GENRES = [
  { emoji: "📖", label: "Gospel" },
  { emoji: "💕", label: "Pop romântico" },
  { emoji: "🎸", label: "Sertanejo" },
  { emoji: "🤠", label: "Sertanejo universitário" },
  { emoji: "🎙️", label: "MPB" },
  { emoji: "🥁", label: "Pagode / samba" },
  { emoji: "🪘", label: "Piseiro / arrocha" },
  { emoji: "🪗", label: "Forró" },
  { emoji: "🌙", label: "Bossa nova" },
  { emoji: "🤘", label: "Rock" },
  { emoji: "🌴", label: "Reggae" },
  { emoji: "🎤", label: "Rap / hip-hop" },
  { emoji: "🧸", label: "Infantil" },
];

const VOICES = [
  { emoji: "👩", label: "Feminina" },
  { emoji: "👨", label: "Masculina" },
  { emoji: "🎤", label: "Dupla" },
  { emoji: "🎲", label: "Surpreenda-me" },
];

const MOODS = [
  { emoji: "❤️", label: "Romântico" },
  { emoji: "😄", label: "Divertido" },
  { emoji: "🥹", label: "Emocionante" },
  { emoji: "🎉", label: "Animado" },
];

const STORY_CHIPS = ["como nos conhecemos", "o que eu admiro", "o que você faz por mim", "uma coisa que nunca te disse"];
const DETAIL_CHIPS = ["um apelido bobo", "uma comida favorita", "um lugar especial", "uma mania engraçada"];
const CHORUS_CHIPS = ["obrigado(a) por...", "eu nunca te disse, mas...", "você me ensinou...", "enquanto eu viver..."];

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
        setFormError(err instanceof Error ? err.message : "Não deu pra criar sua música agora. Tente de novo.");
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
          Continuando de onde parou —{" "}
          <button type="button" onClick={reset} className="underline hover:text-ink">
            começar um pedido novo
          </button>
        </p>
      )}

      {step === 0 && (
        <Step title="Pra quem é esse presente?">
          <ChoiceGrid options={RELATIONSHIPS} value={answers.relationship} onChange={(v) => setAnswer("relationship", v)} />
        </Step>
      )}

      {step === 1 && (
        <Step title="Como você chama essa pessoa?" subtitle="Do jeito que você chama no dia a dia — pode ser um apelido.">
          <input
            autoFocus
            value={answers.nickname}
            onChange={(e) => setAnswer("nickname", e.target.value)}
            placeholder="Zé, mãe, vó Rosa..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-lg text-ink outline-none focus:border-accent"
          />
        </Step>
      )}

      {step === 2 && (
        <Step title="Qual é a ocasião?">
          <ChoiceGrid options={OCCASIONS} value={answers.occasion} onChange={(v) => setAnswer("occasion", v)} />
        </Step>
      )}

      {step === 3 && (
        <Step title={`Que estilo combina com ${answers.nickname || "essa pessoa"}?`} subtitle="É o clima da música. Dá pra mudar depois.">
          <ChoiceGrid options={GENRES} value={answers.genre} onChange={(v) => setAnswer("genre", v)} />
        </Step>
      )}

      {step === 4 && (
        <Step title="Quem canta essa música?">
          <ChoiceGrid
            options={VOICES}
            value={answers.voicePreference === "masculina" ? "Masculina" : answers.voicePreference === "dupla" ? "Dupla" : "Feminina"}
            onChange={(v) => {
              if (v === "Surpreenda-me") {
                setAnswer("voicePreference", Math.random() < 0.5 ? "masculina" : "feminina");
                return;
              }
              setAnswer("voicePreference", v === "Masculina" ? "masculina" : v === "Dupla" ? "dupla" : "feminina");
            }}
          />
          <div className="mt-8 border-t border-base-border pt-6">
            <p className="mb-3 text-xs uppercase tracking-wide text-ink-muted">E o clima da música? (opcional)</p>
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
          title="Quer cantar você mesmo(a)?"
          subtitle="A gente clona sua voz de verdade (você grava um trechinho) e a música sai cantada por você, não pela IA."
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
                <span className="block text-sm font-medium text-ink">Sim, quero cantar com a minha voz</span>
                <span className="block text-xs text-ink-muted">+{formatBRL(VOICE_CLONE_ADDON_CENTS)} no valor final</span>
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
              Não, prefiro a voz da IA que escolhi
            </button>
          </div>
        </Step>
      )}

      {step === 6 && (
        <Step title={`O que ${answers.nickname || "essa pessoa"} é pra você?`} subtitle="Escreva do seu jeito. Quanto mais real, mais única fica a letra.">
          <PromptChips chips={STORY_CHIPS} value={answers.story} onPick={(starter) => setAnswer("story", starter + " ")} />
          <textarea
            autoFocus
            rows={5}
            value={answers.story}
            onChange={(e) => setAnswer("story", e.target.value)}
            placeholder="Ex: nos conhecemos na faculdade e desde então..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <HelperText length={answers.story.trim().length} min={20} />
          <div className="mt-3">
            <VoiceToTextButton onResult={(text) => setAnswer("story", (answers.story ? answers.story + " " : "") + text)} />
          </div>
        </Step>
      )}

      {step === 7 && (
        <Step title={`Conta uma coisa boba sobre ${answers.nickname || "essa pessoa"}`} subtitle="Uma mania, um apelido, uma comida. Não precisa ser bonito, precisa ser verdade.">
          <PromptChips chips={DETAIL_CHIPS} value={answers.funDetail} onPick={(starter) => setAnswer("funDetail", starter + " ")} />
          <textarea
            autoFocus
            rows={4}
            value={answers.funDetail}
            onChange={(e) => setAnswer("funDetail", e.target.value)}
            placeholder="Ex: ela chama até as plantas de casa de 'amor'..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <HelperText length={answers.funDetail.trim().length} min={10} />
          <div className="mt-3">
            <VoiceToTextButton onResult={(text) => setAnswer("funDetail", (answers.funDetail ? answers.funDetail + " " : "") + text)} />
          </div>
        </Step>
      )}

      {step === 8 && (
        <Step title="Uma frase para o refrão?" subtitle="Opcional — mas costuma virar a parte mais forte da música.">
          <PromptChips chips={CHORUS_CHIPS} value={answers.chorusHint} onPick={(starter) => setAnswer("chorusHint", starter + " ")} />
          <textarea
            rows={3}
            value={answers.chorusHint}
            onChange={(e) => setAnswer("chorusHint", e.target.value)}
            placeholder="Ex: obrigado por tudo..."
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-ink outline-none focus:border-accent"
          />
        </Step>
      )}

      {step === 9 && (
        <Step title="Quer citar outros nomes na letra?" subtitle="Filhos, netos, um apelido de família — o que fizer sentido. Opcional.">
          <input
            value={answers.namesToInclude}
            onChange={(e) => setAnswer("namesToInclude", e.target.value)}
            placeholder="Ex: Ana e Théo"
            className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
          />
          {answers.namesToInclude.trim() && (
            <p className="mt-4 rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-sm italic text-ink-muted">
              "...e nunca esquecer {answers.namesToInclude}, do jeitinho que são"
            </p>
          )}
        </Step>
      )}

      {step === 10 && (
        <Step title="Pra onde a gente manda sua letra?" subtitle="A letra fica pronta na próxima tela. O e-mail é só pra você não perder.">
          <div className="flex flex-col gap-3">
            <input
              value={answers.buyerName}
              onChange={(e) => setAnswer("buyerName", e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
            />
            <input
              type="email"
              value={answers.buyerEmail}
              onChange={(e) => setAnswer("buyerEmail", e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
            />
          </div>
        </Step>
      )}

      {step === 11 && (
        <Step title="Tudo certo?" subtitle="Última conferida antes de escrever a letra.">
          <dl className="divide-y divide-base-border rounded-xl border border-base-border bg-base-soft text-sm">
            {[
              ["Pra quem", answers.relationship],
              ["Nome", answers.nickname],
              ["Ocasião", answers.occasion],
              ["Estilo", answers.genre],
              ["Voz", answers.wantsCustomVoice ? "a sua, clonada" : answers.voicePreference],
              ["Clima", answers.mood],
              ["Outros nomes", answers.namesToInclude],
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
            Voltar
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
            {isPending ? "Escrevendo sua letra..." : "Escrever minha letra grátis"}
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
      {missing > 0 ? `Escreva um pouco mais — faltam ${missing} caracteres` : "Perfeito ✓"}
    </p>
  );
}
