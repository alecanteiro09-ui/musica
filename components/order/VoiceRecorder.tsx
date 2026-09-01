"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Play, Pause, Loader2, RotateCcw, SkipForward } from "lucide-react";
import { startVoiceSample, checkVoicePhrase, submitVoiceReading, checkVoiceCloneResult, retryVoiceClone, skipVoiceClone } from "@/lib/actions/voiceClone";
import type { VoiceCloneStatus } from "@/types";

type Step =
  | "intro"
  | "recording_sample"
  | "reviewing_sample"
  | "uploading_sample"
  | "awaiting_phrase"
  | "recording_reading"
  | "reviewing_reading"
  | "uploading_reading"
  | "processing"
  | "ready"
  | "failed";

function initialStep(status: VoiceCloneStatus): Step {
  if (status === "awaiting_phrase") return "awaiting_phrase";
  if (status === "processing") return "processing";
  if (status === "failed") return "failed";
  return "intro";
}

/** Grava, revê e envia um clipe curto de áudio. onDone recebe o Blob gravado. */
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        setBlob(new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Não deu pra acessar o microfone. Verifica a permissão do navegador.");
    }
  }

  function stop() {
    mediaRecorder.current?.stop();
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  }

  function reset() {
    setBlob(null);
    setSeconds(0);
  }

  return { recording, seconds, blob, error, start, stop, reset };
}

function RecordStep({
  title,
  subtitle,
  minSeconds,
  maxSeconds,
  onConfirm,
  busy,
}: {
  title: string;
  subtitle: string;
  minSeconds: number;
  maxSeconds: number;
  onConfirm: (blob: Blob) => void;
  busy: boolean;
}) {
  const rec = useRecorder();

  // Para sozinho no limite — grava só o necessário, sem enrolação, pra
  // validar e clonar mais rápido (upload menor, menos áudio pra Kie.ai analisar).
  useEffect(() => {
    if (rec.recording && rec.seconds >= maxSeconds) rec.stop();
  }, [rec.recording, rec.seconds, maxSeconds, rec.stop]);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrl = rec.blob ? URL.createObjectURL(rec.blob) : null;

  return (
    <div className="text-center">
      <h2 className="font-display text-xl italic text-ink">{title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>

      {rec.error && <p className="mt-3 text-sm text-red-500">{rec.error}</p>}

      {!rec.blob ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={rec.recording ? rec.stop : rec.start}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-on-accent transition-transform hover:scale-105 active:scale-95 ${
              rec.recording ? "bg-red-500 animate-[pulse-ring_1.6s_ease-out_infinite]" : "bg-accent"
            }`}
            aria-label={rec.recording ? "Parar gravação" : "Começar a gravar"}
          >
            {rec.recording ? <Square size={22} /> : <Mic size={24} />}
          </button>
          <p className="text-xs text-ink-muted">
            {rec.recording ? `Gravando... ${rec.seconds}s / ${maxSeconds}s` : `Toque pra gravar (${minSeconds}-${maxSeconds}s)`}
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (playing) audioRef.current?.pause();
              else audioRef.current?.play();
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <audio ref={audioRef} src={blobUrl ?? undefined} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
          <div className="flex gap-3">
            <button type="button" onClick={rec.reset} className="flex items-center gap-1 rounded-full border border-base-border px-4 py-2 text-sm text-ink-muted hover:border-accent-dim">
              <RotateCcw size={14} /> Gravar de novo
            </button>
            <button
              type="button"
              disabled={busy || rec.seconds < minSeconds}
              onClick={() => rec.blob && onConfirm(rec.blob)}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Usar essa gravação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VoiceRecorder({
  buyerToken,
  voiceStatus,
  voiceError,
}: {
  buyerToken: string;
  voiceStatus: VoiceCloneStatus;
  voiceError: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => initialStep(voiceStatus));
  const [phrase, setPhrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(voiceError);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step !== "awaiting_phrase") return;
    const poll = setInterval(async () => {
      const result = await checkVoicePhrase(buyerToken);
      if (result.status === "failed") {
        setError(result.error || "Não deu pra validar essa amostra.");
        setStep("failed");
      } else if (result.phrase) {
        setPhrase(result.phrase);
        setStep("recording_reading");
      }
    }, 1200);
    return () => clearInterval(poll);
  }, [step, buyerToken]);

  useEffect(() => {
    if (step !== "processing") return;
    const poll = setInterval(async () => {
      const result = await checkVoiceCloneResult(buyerToken);
      if (result.status === "ready") {
        setStep("ready");
        router.refresh();
      } else if (result.status === "failed") {
        setError(result.error || "Não deu pra clonar essa voz.");
        setStep("failed");
      }
    }, 1200);
    return () => clearInterval(poll);
  }, [step, buyerToken, router]);

  async function handleSampleConfirm(blob: Blob) {
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("audio", blob, "sample.webm");
    const result = await startVoiceSample(buyerToken, formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("awaiting_phrase");
  }

  async function handleReadingConfirm(blob: Blob) {
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("audio", blob, "reading.webm");
    const result = await submitVoiceReading(buyerToken, formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("processing");
  }

  async function handleRetry() {
    setError(null);
    setPhrase(null);
    await retryVoiceClone(buyerToken);
    setStep("intro");
  }

  async function handleSkip() {
    setBusy(true);
    await skipVoiceClone(buyerToken);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-center text-sm uppercase tracking-wide text-accent">sua voz na música</p>
      <h1 className="mt-2 text-center font-display text-2xl italic text-ink">Vamos clonar sua voz</h1>

      <div className="mt-8 rounded-xl border border-base-border bg-base-soft p-6">
        {step === "intro" && (
          <RecordStep
            title="Grave um trecho cantando"
            subtitle="Só uns 8-12 segundos, num lugar mais silencioso possível. Curto e direto valida mais rápido."
            minSeconds={8}
            maxSeconds={12}
            busy={busy}
            onConfirm={handleSampleConfirm}
          />
        )}

        {(step === "awaiting_phrase" || step === "uploading_sample") && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 size={22} className="animate-spin text-accent" />
            <p className="text-sm text-ink-muted">Analisando sua voz... geralmente leva menos de 1 minuto.</p>
          </div>
        )}

        {step === "recording_reading" && phrase && (
          <RecordStep
            title="Agora leia (ou cante) essa frase"
            subtitle={`"${phrase}"`}
            minSeconds={2}
            maxSeconds={7}
            busy={busy}
            onConfirm={handleReadingConfirm}
          />
        )}

        {(step === "processing" || step === "uploading_reading") && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 size={22} className="animate-spin text-accent" />
            <p className="text-sm text-ink-muted">Confirmando que é você e clonando sua voz... quase lá.</p>
          </div>
        )}

        {step === "ready" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm font-medium text-success">Sua voz está pronta! Preparando a próxima etapa...</p>
            <Loader2 size={18} className="animate-spin text-accent" />
          </div>
        )}

        {step === "failed" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw size={14} /> Tentar de novo
              </button>
            </div>
          </div>
        )}

        {error && step !== "failed" && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>

      {step !== "ready" && (
        <button
          type="button"
          onClick={handleSkip}
          disabled={busy}
          className="mx-auto mt-6 flex items-center gap-2 text-sm text-ink-muted underline hover:text-ink disabled:opacity-60"
        >
          <SkipForward size={14} /> Prefiro seguir com a voz padrão da IA
        </button>
      )}
    </div>
  );
}
