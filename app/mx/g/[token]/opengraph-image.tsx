import { ImageResponse } from "next/og";
import { getGiftByToken } from "@/lib/actions/orders";

/**
 * Equivalente MX de app/g/[token]/opengraph-image.tsx (Brasil) — mesmo
 * mecanismo (ver comentário lá sobre o bug do @vercel/og no Windows dev),
 * só copy em espanhol.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`Fuente no encontrada: ${family}`);
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

export default async function GiftOgImage({ params }: { params: { token: string } }) {
  const gift = await getGiftByToken(params.token);
  const nickname = gift?.nickname || "alguien especial";

  const headline = `Alguien hizo una canción para ${nickname}`;
  const eyebrow = "VERSO ÚNICO";
  const subtext = "Toca para escuchar";
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
