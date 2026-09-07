import { WizardProvider } from "@/components/mx/wizard/WizardProvider";
import { Wizard } from "@/components/mx/wizard/Wizard";

export const metadata = { title: "Crear mi canción" };

export default function CrearPage() {
  return (
    <WizardProvider>
      <Wizard />
    </WizardProvider>
  );
}
