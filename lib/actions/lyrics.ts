"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getLyricsProvider } from "@/lib/ai/lyrics";
import { getOrderByBuyerToken } from "./orders";
import { orderToWizardAnswers } from "@/lib/order-mapper";

/** Registra o refrão escolhido e escreve a letra completa em volta dele. */
export async function selectChorusAndGenerateFullLyric(buyerToken: string, chosenChorus: string): Promise<void> {
  const bundle = await getOrderByBuyerToken(buyerToken);
  if (!bundle) throw new Error("Pedido não encontrado.");
  const { order, lyrics } = bundle;

  const supabase = createAdminClient();

  const chosenOption = lyrics.find((l) => l.kind === "chorus_option" && l.content === chosenChorus);
  if (chosenOption) {
    await supabase.from("order_lyrics").update({ is_selected: true }).eq("id", chosenOption.id);
  }

  const fullLyric = await getLyricsProvider().generateFullLyric({
    ...orderToWizardAnswers(order),
    chosenChorus,
  });

  await supabase.from("order_lyrics").insert({
    order_id: order.id,
    kind: "full_lyric",
    content: fullLyric,
    is_current: true,
    source: "ai",
  });

  revalidatePath(`/pedido/${buyerToken}`);
}
