"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { WizardAnswers } from "@/types";

// Chave própria, diferente de "verso_unico_wizard_v1" (components/wizard/WizardProvider.tsx)
// — sem isso, um rascunho do wizard BR e um do MX no mesmo navegador se
// sobrescreveriam um ao outro.
const STORAGE_KEY = "verso_unico_mx_wizard_v1";

const EMPTY_ANSWERS: WizardAnswers = {
  relationship: "",
  nickname: "",
  occasion: "",
  genre: "",
  voicePreference: "feminina",
  story: "",
  funDetail: "",
  chorusHint: "",
  buyerName: "",
  buyerEmail: "",
  wantsCustomVoice: false,
  mood: "",
  namesToInclude: "",
  market: "mx",
};

interface WizardContextValue {
  answers: WizardAnswers;
  setAnswer: <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => void;
  step: number;
  setStep: (step: number) => void;
  reset: () => void;
  markSubmitted: () => void;
  hydrated: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY_ANSWERS);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Mesma lógica do wizard BR (ver components/wizard/WizardProvider.tsx):
        // um wizard já enviado nunca deve voltar sozinho.
        if (!parsed.submitted && parsed.answers) {
          setAnswers({ ...EMPTY_ANSWERS, ...parsed.answers, market: "mx" });
          if (typeof parsed.step === "number") setStep(parsed.step);
        } else if (parsed.submitted) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignora storage corrompido
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step }));
  }, [answers, step, hydrated]);

  function setAnswer<K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setAnswers(EMPTY_ANSWERS);
    setStep(0);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function markSubmitted() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step, submitted: true }));
  }

  return (
    <WizardContext.Provider value={{ answers, setAnswer, step, setStep, reset, markSubmitted, hydrated }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard precisa estar dentro de <WizardProvider> (components/mx/wizard)");
  return ctx;
}
