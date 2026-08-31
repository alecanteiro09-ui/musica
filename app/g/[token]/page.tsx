import { notFound } from "next/navigation";
import { getGiftByToken } from "@/lib/actions/orders";
import { GiftExperience } from "@/components/gift/GiftExperience";

export async function generateMetadata({ params }: { params: { token: string } }) {
  const gift = await getGiftByToken(params.token);
  if (!gift) return { title: "Presente não encontrado" };
  return {
    title: `Uma música para ${gift.nickname}`,
    openGraph: { title: `Uma música para ${gift.nickname}`, description: "Feito com Verso Único" },
  };
}

export default async function GiftPage({ params }: { params: { token: string } }) {
  const gift = await getGiftByToken(params.token);
  if (!gift) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const giftUrl = `${siteUrl}/g/${params.token}`;

  return <GiftExperience gift={gift} giftUrl={giftUrl} />;
}
