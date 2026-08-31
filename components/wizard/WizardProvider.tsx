"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { WizardAnswers } from "@/types";

const STORAGE_KEY = "verso_unico_wizard_v1";

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
};

interface WizardContextValue {
  answers: WizardAnswers;
  setAnswer: <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => void;
  step: number;
  setStep: (step: number) => void;
  reset: () => void;
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
        if (parsed.answers) setAnswers({ ...EMPTY_ANSWERS, ...parsed.answers });
        if (typeof parsed.step === "number") setStep(parsed.step);
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

  return (
    <WizardContext.Provider value={{ answers, setAnswer, step, setStep, reset, hydrated }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard precisa estar dentro de <WizardProvider>");
  return ctx;
}
