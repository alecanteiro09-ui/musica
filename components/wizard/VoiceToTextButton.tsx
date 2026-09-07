"use client";

import { useRef, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Alternativa a digitar: dita e a gente transcreve pro campo, via
 * SpeechRecognition do navegador (sem custo de API — só funciona em
 * Chrome/Edge/Safari; em navegadores sem suporte o botão nem aparece).
 */
export function VoiceToTextButton({
  onResult,
  lang = "pt-BR",
  labels = { listening: "Te escutando... toque pra parar", idle: "Prefiro falar" },
}: {
  onResult: (text: string) => void;
  /** BCP-47 do reconhecimento de voz do navegador — "pt-BR" (padrão) ou "es-MX" (app/mx). */
  lang?: string;
  labels?: { listening: string; idle: string };
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognitionCtor =
    typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

  if (!SpeechRecognitionCtor) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) onResult(transcript.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors",
        listening ? "border-accent bg-accent-soft text-ink" : "border-base-border text-ink-muted hover:border-accent-dim"
      )}
    >
      {listening ? <Loader2 size={16} className="animate-spin text-accent" /> : <Mic size={16} />}
      {listening ? labels.listening : labels.idle}
    </button>
  );
}
