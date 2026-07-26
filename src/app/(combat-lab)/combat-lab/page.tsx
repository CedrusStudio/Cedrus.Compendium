import { CombatLabTabs } from "@/application/combat-lab/runner/CombatLabTabs";

export const metadata = {
  title: "Laboratorium Systemu",
};

export default function CombatLabPage()
{
  return (
    <div className="container mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Laboratorium Systemu</h1>
        <p className="text-muted-foreground">
          Wybierz dwie postacie, nałóż wzmocnienia na czas symulacji i uruchom tysiące deterministycznych walk.
          Każdą pojedynczą walkę można odtworzyć z tego samego seeda.
        </p>
      </div>
      <CombatLabTabs />
    </div>
  );
}
