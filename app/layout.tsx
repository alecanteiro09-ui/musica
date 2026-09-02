import type { Metadata } from "next";
import { Suspense } from "react";
import { Newsreader, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Pixels } from "@/components/analytics/Pixels";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Verso Único | Sua história, em canção",
    template: "%s | Verso Único",
  },
  description:
    "Conte a história de alguém que você ama e receba uma música original, cantada e composta pela sua história — em minutos.",
  openGraph: {
    title: "Verso Único",
    description: "Sua história, em canção.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-base font-sans text-ink antialiased">
        <Pixels />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
