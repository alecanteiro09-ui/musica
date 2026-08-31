import { WizardProvider } from "@/components/wizard/WizardProvider";
import { Wizard } from "@/components/wizard/Wizard";

export const metadata = { title: "Criar minha música" };

export default function CriarPage() {
  return (
    <WizardProvider>
      <Wizard />
    </WizardProvider>
  );
}
