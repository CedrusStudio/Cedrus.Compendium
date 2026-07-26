import { ReplayDemo } from "@/application/combat-lab/demo/ReplayDemo";

export const metadata = {
  title: "Laboratorium Systemu — Powtórka",
};

export default function CombatReplayPage()
{
  return (
    <div className="container mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Combat Replay</h1>
        <p className="text-muted-foreground">
          Deterministyczny podgląd pojedynczej walki tura po turze. Zmień seed, aby odtworzyć inną walkę —
          ten sam seed zawsze daje identyczny przebieg.
        </p>
      </div>
      <ReplayDemo />
    </div>
  );
}
