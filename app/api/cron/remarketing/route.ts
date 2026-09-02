import { NextRequest, NextResponse } from "next/server";
import { runRemarketingSweep } from "@/lib/remarketing";

/**
 * Disparado 1x/dia pelo cron do Vercel (ver vercel.json). A Vercel injeta o
 * header Authorization com CRON_SECRET automaticamente quando essa env var
 * está configurada — checar isso é o que impede qualquer um que descubra a
 * URL de disparar e-mail em massa pros nossos clientes.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const result = await runRemarketingSweep();
  return NextResponse.json({ ok: true, ...result });
}
