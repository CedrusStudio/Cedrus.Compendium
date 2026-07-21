import { SimulationReport } from "@/application/combat-lab/report/SimulationReport";

export const metadata = {
  title: "Combat Lab — Raport",
};

type RouteParams = { params: Promise<{ id: string }> };

export default async function CombatLabReportPage({ params }: RouteParams)
{
  const { id } = await params;
  return (
    <div className="container mx-auto max-w-3xl px-6 py-8">
      <SimulationReport id={id} />
    </div>
  );
}
