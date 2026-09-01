import { ImageResponse } from "next/og";
import { getGiftByToken } from "@/lib/actions/orders";

/**
 * Card de compartilhamento (WhatsApp/redes) da página-presente, gerado por
 * pedido com o apelido do destinatário. Nota: `next dev` no Windows quebra
 * QUALQUER uso de ImageResponse — inclusive um `<div>hello</div>` sem fonte
 * nenhuma, confirmado testando isolado — por um bug no carregamento da fonte
 * de fallback embutida do @vercel/og (mistura `\` e `/` montando uma URL
 * `file://`, gerando `ERR_INVALID_URL`). Não é bug deste arquivo; roda normal
 * na Vercel (Linux). Pra conferir visualmente em dev no Windows, só mesmo
 * rodando `next build && next start` (build de produção usa outro caminho
 * de código) ou testando direto num Linux/WSL.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`Fonte não encontrada: ${family}`);
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

export default async function GiftOgImage({ params }: { params: { token: string } }) {
  const gift = await getGiftByToken(params.token);
  const nickname = gift?.nickname || "alguém especial";

  const headline = `Alguém fez uma música pra ${nickname}`;
  const eyebrow = "VERSO ÚNICO";
  const subtext = "Toque para ouvir";
  // Satori (o renderer do @vercel/og) não aplica text-transform — os glifos
  // pedidos ao Google Fonts precisam bater exatamente com o texto renderizado
  // (aqui, já em maiúsculas), senão cai num fallback de fonte que quebra no
  // Windows (bug conhecido do @vercel/og com o caminho do arquivo de fallback).
  const [displayFont, sansFont] = await Promise.all([
    loadGoogleFont("Newsreader:ital@1", headline),
    loadGoogleFont("Manrope:wght@600", `${eyebrow}${subtext}`),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#241C2C",
          backgroundImage:
            "radial-gradient(circle at 80% 15%, rgba(255,122,84,0.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(227,167,61,0.25), transparent 40%)",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Manrope",
            fontSize: 22,
            letterSpacing: 4,
            color: "#E3A73D",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontFamily: "Newsreader",
            fontStyle: "italic",
            fontSize: 60,
            lineHeight: 1.25,
            textAlign: "center",
            color: "#FBF7FA",
            maxWidth: 900,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontFamily: "Manrope",
            fontSize: 24,
            color: "#C9BBCE",
          }}
        >
          {subtext}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: displayFont, style: "italic", weight: 500 },
        { name: "Manrope", data: sansFont, weight: 600 },
      ],
    }
  );
}
