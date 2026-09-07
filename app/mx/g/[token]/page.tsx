import { notFound } from "next/navigation";
import { getGiftByToken } from "@/lib/actions/orders";
import { GiftExperience } from "@/components/mx/gift/GiftExperience";

// Nunca cachear estáticamente: se pueden agregar fotos después de la entrega
// y las signed URLs de audio expiran en 1h — se reemiten en cada acceso.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { token: string } }) {
  const gift = await getGiftByToken(params.token);
  if (!gift) return { title: "Regalo no encontrado" };
  return {
    title: `Una canción para ${gift.nickname}`,
    openGraph: { title: `Una canción para ${gift.nickname}`, description: "Hecho con Verso Único" },
  };
}

export default async function GiftPage({ params }: { params: { token: string } }) {
  const gift = await getGiftByToken(params.token);
  if (!gift) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const giftUrl = `${siteUrl}/mx/g/${params.token}`;

  return <GiftExperience gift={gift} giftUrl={giftUrl} giftToken={params.token} />;
}
