"use client";

/**
 * Statistics dashboard for a run's results — histograms/breakdowns rendered with
 * recharts (BarChart). Polish labels for death causes and end reasons.
 */

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { RawResult } from "@/domain/combat-lab/simulation/RawResult";
import { computeStatistics, type CountBucket } from "@/domain/combat-lab/analysis/distributions";
import { deathCauseLabelsPl } from "@/domain/combat-lab/i18n/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { ChartValues } from './ChartValues';

const REASON_LABELS_PL: Record<string, string> = {
  knockout: "Nokaut",
  lethal: "Śmiertelne",
  timeout: "Limit rund",
  draw: "Remis",
};

export function StatisticsDashboard({ results }: { results: RawResult[] })
{
  const stats = useMemo(() => computeStatistics(results), [results]);

  const deathCauses = stats.deathCauses.map(b => ({ label: deathCauseLabelsPl[b.label as keyof typeof deathCauseLabelsPl] ?? b.label, count: b.count }));
  const reasons = stats.reasons.map(b => ({ label: REASON_LABELS_PL[b.label] ?? b.label, count: b.count }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <BarPanel title="Długość walk (rundy)" data={stats.rounds} color="#3b82f6" />
      <BarPanel title="HP zwycięzcy" data={stats.winnerHp} color="#10b981" />
      <BarPanel title="Przyczyny śmierci" data={deathCauses} color="#ef4444" />
      <BarPanel title="Sposób zakończenia" data={reasons} color="#a855f7" />
      {stats.maneuverUsage.length > 0 && (
        <div className="lg:col-span-2">
          <BarPanel title="Najczęściej używane manewry" data={stats.maneuverUsage} color="#f59e0b" />
        </div>
      )}
    </div>
  );
}

function BarPanel({ title, data, color }: { title: string; data: CountBucket[]; color: string })
{
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak danych.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.2)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={data.length > 8 ? -30 : 0} textAnchor={data.length > 8 ? "end" : "middle"} height={data.length > 8 ? 60 : 30} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
              <Tooltip cursor={{ fill: "hsl(0 0% 50% / 0.1)" }} />
              <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {data.length > 0 && <ChartValues data={data} />}
      </CardContent>
    </Card>
  );
}
