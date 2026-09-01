import { NextRequest, NextResponse } from "next/server";
import { synthesizeToneWav } from "@/lib/ai/providers/mock-audio";

/**
 * Serve o tom sintetizado do provedor mock de música (ver
 * lib/ai/providers/mock-music.ts). Não é conteúdo sensível — é só um
 * placeholder audível — então não precisa da checagem de token/status que
 * o bucket "tracks" real exige.
 *
 * Precisa responder a Range requests: elementos <audio> sempre pedem um
 * range de bytes antes de tocar (pra permitir seek), e sem suporte a isso
 * (206 + Content-Range) o elemento fica preso em readyState 0 pra sempre em
 * produção — sem erro, sem timeout, só nunca carrega. Um `fetch()` comum
 * pro mesmo endpoint funciona normalmente, o que mascarava o problema.
 */
export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const wav = synthesizeToneWav(params.jobId, 55);
  const range = req.headers.get("range");

  if (!range) {
    return new NextResponse(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const match = range.match(/bytes=(\d*)-(\d*)/);
  const start = match?.[1] ? parseInt(match[1], 10) : 0;
  const end = match?.[2] ? parseInt(match[2], 10) : wav.length - 1;
  const chunk = wav.subarray(start, end + 1);

  return new NextResponse(new Uint8Array(chunk), {
    status: 206,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Range": `bytes ${start}-${end}/${wav.length}`,
      "Content-Length": String(chunk.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
