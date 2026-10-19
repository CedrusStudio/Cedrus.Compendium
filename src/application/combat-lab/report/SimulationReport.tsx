"use client";

/**
 * Printable report for a saved simulation run. Uses only persisted data (config
 * + summary). The "Drukuj / Zapisz PDF" button triggers the browser print dialog
 * (Save as PDF); it hides itself in print via Tailwind's `print:` variant — so
 * PDF export needs no extra dependency.
 */

import { useQuery } from "@tanstack/react-query";
import combatLabClient, { type SavedSimulationDto } from "@/infrastructure/clients/combatLabClient";
import { useApiKey } from "@/common/hooks/useApiKey";
import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";
import { deathCauseLabelsPl } from "@/domain/combat-lab/i18n/labels";
import { toOffenseString } from "@/domain/characters/combat/Offense";
import { Button } from "@/common/components/ui/button";

const REASON_LABELS_PL: Record<string, string> = { knockout: "Nokaut", lethal: "Śmiertelne", timeout: "Limit rund", draw: "Remis" };

export function SimulationReport({ id }: { id: string })
{
  const { apiKey } = useApiKey();
  const { data, isLoading, error } = useQuery<SavedSimulationDto>({
    queryKey: ["combat-lab-simulation", id, apiKey ?? ""],
    queryFn: () => combatLabClient.getSimulation(id),
    staleTime: 5_000,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Wczytywanie raportu…</p>;
  if (error || !data) return <p className="text-sm text-destructive">Nie udało się wczytać raportu.</p>;

  const { configuration, result } = data;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold">Raport symulacji</h1>
        <Button onClick={() => window.print()}>Drukuj / Zapisz PDF</Button>
      </div>

      <div className="rounded border p-6 print:border-0 print:p-0">
        <header className="mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold">{data.name}</h2>
          <p className="text-sm text-muted-foreground">
            {configuration.a.name} vs {configuration.b.name} · {configuration.count} walk · wygenerowano {new Date().toLocaleString("pl-PL")}
          </p>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
          <CombatantCard label="Combatant A" snapshot={configuration.a} />
          <CombatantCard label="Combatant B" snapshot={configuration.b} />
        </section>

        <section className="mb-4">
          <h3 className="mb-2 font-semibold">Parametry</h3>
          <ul className="text-sm text-muted-foreground">
            <li>Liczba walk: {configuration.count} (seed od {configuration.seedStart})</li>
            <li>Strategia A: {configuration.policyA?.name ?? "domyślna"} · Strategia B: {configuration.policyB?.name ?? "domyślna"}</li>
            {configuration.maxRounds && <li>Limit rund: {configuration.maxRounds}</li>}
            {configuration.distanceST !== undefined && <li>ST odległości: {configuration.distanceST}</li>}
          </ul>
        </section>

        <SummarySection summary={result} a={configuration.a} b={configuration.b} />
      </div>
    </div>
  );
}

function CombatantCard({ label, snapshot }: { label: string; snapshot: CombatantSnapshot })
{
  const offense = snapshot.defaultOffenseId ? snapshot.offenses.find(o => o.id === snapshot.defaultOffenseId) ?? snapshot.offenses[0] : snapshot.offenses[0];
  return (
    <div className="rounded border p-3 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{snapshot.name}</div>
      <div>HP: {snapshot.maxHp}{snapshot.barrier > 0 ? ` (+${snapshot.barrier} bariery)` : ""}</div>
      <div>Atak: {offense ? toOffenseString(offense.leadingWeapon) || "—" : "—"} · {snapshot.attackKind}</div>
      <div>Manewry: {snapshot.maneuvers.length}</div>
    </div>
  );
}

function SummarySection({ summary, a, b }: { summary: SimulationSummary; a: CombatantSnapshot; b: CombatantSnapshot })
{
  const pct = (v: number | undefined) => `${((v ?? 0) * 100).toFixed(1)}%`;
  const deathCauses = Object.entries(summary.deathCauses).sort((x, y) => y[1] - x[1]);
  const reasons = Object.entries(summary.reasons).filter(([, c]) => c > 0);

  // Winner/loser of the whole series: higher Win Rate wins. Equal rates → no
  // decisive winner (the run was a wash).
  const rateA = summary.winRates[a.id] ?? 0;
  const rateB = summary.winRates[b.id] ?? 0;
  const decisive = rateA !== rateB;
  const winner = decisive ? (rateA > rateB ? a : b) : null;
  const loser = decisive ? (rateA > rateB ? b : a) : null;

  return (
    <section>
      <h3 className="mb-2 font-semibold">Wyniki</h3>
      <table className="mb-4 block w-full table-fixed text-sm [overflow-wrap:anywhere] sm:table print:table">
        <tbody className="block sm:table-row-group print:table-row-group">
          <MetricRow
            label="Zwycięzca serii"
            value={winner ? `${winner.name} (${winner.id})` : "nierozstrzygnięte"}
          />
          <MetricRow
            label="Przegrany serii"
            value={loser ? `${loser.name} (${loser.id})` : "nierozstrzygnięte"}
          />
          <MetricRow label={`Win Rate — ${a.name}`} value={pct(summary.winRates[a.id])} />
          <MetricRow label={`Win Rate — ${b.name}`} value={pct(summary.winRates[b.id])} />
          <MetricRow label="Remisy" value={`${summary.draws}`} />
          <MetricRow label="Śr. liczba rund" value={summary.averageRounds.toFixed(1)} />
          <MetricRow label="Śr. HP zwycięzcy" value={summary.averageWinnerHp.toFixed(1)} />
          <MetricRow label="Najczęstszy manewr" value={summary.mostUsedManeuver ?? "—"} />
        </tbody>
      </table>

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 print:grid-cols-2">
        <div>
          <h4 className="mb-1 font-medium">Przyczyny śmierci</h4>
          <ul className="text-muted-foreground">
            {deathCauses.map(([cause, c]) => (
              <li key={cause}>{deathCauseLabelsPl[cause as keyof typeof deathCauseLabelsPl] ?? cause}: {c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 font-medium">Sposób zakończenia</h4>
          <ul className="text-muted-foreground">
            {reasons.map(([reason, c]) => <li key={reason}>{REASON_LABELS_PL[reason] ?? reason}: {c}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string })
{
  return (
    <tr className="flex flex-col gap-1 border-b py-2 sm:table-row sm:py-0 print:table-row">
      <td className="py-1 pr-4">{label}</td>
      <td className="py-1 font-semibold tabular-nums sm:text-right print:text-right">{value}</td>
    </tr>
  );
}
