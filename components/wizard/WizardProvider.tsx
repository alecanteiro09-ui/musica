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
  wantsCustomVoice: false,
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
        // Um wizard já enviado (pedido criado) nunca deve voltar sozinho — sem
        // isso, quem termina um pedido e volta em /criar pra fazer OUTRO cai
        // direto na tela de confirmação do pedido anterior, com tudo
        // preenchido, e parece que não dá pra criar um novo (bug reportado
        // pelo usuário). Descarta o rascunho e começa do zero nesse caso.
        if (!parsed.submitted && parsed.answers) {
          setAnswers({ ...EMPTY_ANSWERS, ...parsed.answers });
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

  // Chamado no instante do envio, antes da Server Action redirecionar — o
  // redirect() joga a navegação pra /pedido/[token] sem deixar código do
  // cliente rodar depois do await, então é aqui (não depois) que dá pra
  // marcar que esse rascunho já virou pedido.
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
  if (!ctx) throw new Error("useWizard precisa estar dentro de <WizardProvider>");
  return ctx;
}
