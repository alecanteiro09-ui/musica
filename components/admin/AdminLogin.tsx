"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { adminLogin } from "@/lib/actions/admin-auth";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminLogin(password);
      if (!result.ok) {
        setError(result.error || "Senha incorreta.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Lock size={20} />
        </div>
      </div>
      <h1 className="mt-4 text-center font-display text-2xl italic text-ink">Área restrita</h1>
      <p className="mt-1.5 text-center text-sm text-ink-muted">Painel interno — não é a área do cliente.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="w-full rounded-xl border border-base-border bg-base-soft px-4 py-3 text-center text-ink outline-none focus:border-accent"
        />
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition-transform hover:scale-[1.02] hover:bg-accent-dim active:scale-[0.98] disabled:opacity-60"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          Entrar
        </button>
      </form>
    </div>
  );
}
