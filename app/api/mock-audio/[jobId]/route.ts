import { NextRequest, NextResponse } from "next/server";
import { synthesizeToneWav } from "@/lib/ai/providers/mock-audio";

/**
 * Serve o tom sintetizado do provedor mock de música (ver
 * lib/ai/providers/mock-music.ts). Não é conteúdo sensível — é só um
 * placeholder audível — então não precisa da checagem de token/status que
 * o bucket "tracks" real exige.
 */
export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const wav = synthesizeToneWav(params.jobId, 55);
  return new NextResponse(new Uint8Array(wav), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
