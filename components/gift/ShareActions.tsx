"use client";

import { useState, useTransition } from "react";
import { Download, Mail, Share2, Check, Loader2 } from "lucide-react";
import { sendGiftLinkByEmail } from "@/lib/actions/orders";

export function ShareActions({ audioUrl, giftToken, nickname }: { audioUrl: string; giftToken: string; nickname: string }) {
  const [sharing, setSharing] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSaveToPhone() {
    setSharing(true);
    try {
      const canShareFiles = typeof navigator !== "undefined" && "canShare" in navigator;
      if (canShareFiles) {
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        const file = new File([blob], `musica-para-${nickname || "voce"}.mp3`, { type: "audio/mpeg" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Uma música para ${nickname}` });
          setSharing(false);
          return;
        }
      }
    } catch {
      // usuário cancelou o share nativo ou o navegador recusou — cai pro download direto
    }
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `musica-para-${nickname || "voce"}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setSharing(false);
  }

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    startTransition(async () => {
      const result = await sendGiftLinkByEmail(giftToken, email);
      if (result.ok) {
        setEmailState("sent");
      } else {
        setEmailState("error");
        setErrorMsg(result.error || "Não deu pra enviar agora.");
      }
    });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSaveToPhone}
          disabled={sharing}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-on-accent shadow-[0_10px_30px_-10px_rgba(255,122,84,0.55)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
        >
          {sharing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Salvar no celular
        </button>
        <button
          type="button"
          onClick={() => setEmailOpen((v) => !v)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm text-[#FBF7FA]/80 transition-colors hover:border-white/40"
        >
          <Mail size={16} /> Enviar por e-mail
        </button>
      </div>

      {emailOpen && (
        <form onSubmit={handleSendEmail} className="mt-3 flex flex-col gap-2" style={{ animation: "rise-in 0.3s ease both" }}>
          {emailState === "sent" ? (
            <p className="flex items-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm text-success">
              <Check size={16} /> Link enviado! Confere a caixa de entrada de {email}.
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailState("idle");
                  }}
                  placeholder="seu@email.com"
                  className="flex-1 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-[#FBF7FA] placeholder:text-[#FBF7FA]/40 outline-none focus:border-accent-dim"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                  Enviar
                </button>
              </div>
              {emailState === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
            </>
          )}
        </form>
      )}
    </div>
  );
}
