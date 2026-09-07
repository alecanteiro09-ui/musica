import { WizardProvider } from "@/components/mx/wizard/WizardProvider";
import { Wizard } from "@/components/mx/wizard/Wizard";

export const metadata = {
  title: "Crear mi canción",
  description: "Cuenta la historia de alguien que amas y recibe una canción original en minutos. La letra es gratis.",
  openGraph: {
    title: "Crear mi canción — Verso Único México",
    description: "Cuenta la historia de alguien que amas y recibe una canción original en minutos.",
    type: "website",
    locale: "es_MX",
  },
};

export default function CrearPage() {
  return (
    <WizardProvider>
      <Wizard />
    </WizardProvider>
  );
}
