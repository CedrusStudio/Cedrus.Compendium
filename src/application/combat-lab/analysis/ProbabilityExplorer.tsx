"use client";

/**
 * Probability Explorer: tweak a single attack (offense dice / crit, defender
 * layers, damage category, optional ranged to-hit) and see the impact instantly
 * — expected damage, crit rate, hit chance, hits-to-kill, and a damage
 * distribution histogram. Backed by the deterministic Monte-Carlo in
 * domain/combat-lab/analysis/probability.ts.
 */

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { explore, type ProbabilityConfig } from "@/domain/combat-lab/analysis/probability";
import type { DamageType } from "@/domain/combat-lab/effects/Effect";
import type { Offense } from "@/domain/characters/combat/Offense";
import type { Defense } from "@/domain/characters/combat/Defense";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

const CATEGORY_LABELS: Record<DamageType, string> = {
  zwyczajne: "Zwyczajne (zwarcie)",
  blokowane: "Blokowane (magia dyst.)",
  bezpośrednie: "Bezpośrednie (dystans fiz.)",
  śmiertelne: "Śmiertelne",
  nieuchronne: "Nieuchronne",
};

export function ProbabilityExplorer()
{
  // Offense
  const [amount, setAmount] = useState(2);
  const [grade, setGrade] = useState(6);
  const [bonus, setBonus] = useState(4);
  const [critRange, setCritRange] = useState(0);
  const [critPower, setCritPower] = useState(0);
  // Defense
  const [block, setBlock] = useState(0);
  const [parry, setParry] = useState(0);
  const [dodge, setDodge] = useState(0);
  const [protection, setProtection] = useState(0);
  const [resistance, setResistance] = useState(0);
  const [immunity, setImmunity] = useState(0);
  // Misc
  const [category, setCategory] = useState<DamageType>("zwyczajne");
  const [targetHp, setTargetHp] = useState(40);
  // Ranged
  const [ranged, setRanged] = useState(false);
  const [precision, setPrecision] = useState(6);
  const [precisionGrade, setPrecisionGrade] = useState(3);
  const [reflex, setReflex] = useState(4);
  const [distanceST, setDistanceST] = useState(5);

  const result = useMemo(() =>
  {
    const offense: Offense = {
      id: "explore", name: "explore",
      leadingWeapon: { amount, grade, bonus, isPhantom: false, critical: { power: critPower, range: critRange } },
      secondaryWeapon: undefined,
      damageBonus: { amount: 0, grade: 0, bonus: 0, isPhantom: false },
      additionalDamageBonus: undefined,
    };
    const defense: Defense = { id: "d", name: "d", immunity, resistance, protection, block, parry, dodge, bonus: 0 };
    const config: ProbabilityConfig = {
      offense, defense, category, targetHp, samples: 4000,
      ranged: ranged ? { precision: { grade: precisionGrade, value: precision, bonus: 0, testBonus: 0 }, reflex: { grade: 3, value: reflex, bonus: 0, testBonus: 0 }, distanceST } : undefined,
    };
    return explore(config);
  }, [amount, grade, bonus, critRange, critPower, block, parry, dodge, protection, resistance, immunity, category, targetHp, ranged, precision, precisionGrade, reflex, distanceST]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-base">Atak</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <NumberField label="Kości (ilość)" value={amount} onChange={setAmount} min={0} />
          <NumberField label="Ranga kości" value={grade} onChange={setGrade} min={0} />
          <NumberField label="Bonus obrażeń" value={bonus} onChange={setBonus} />
          <NumberField label="Szansa krytyka" value={critRange} onChange={setCritRange} />
          <NumberField label="Siła krytyka" value={critPower} onChange={setCritPower} />
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Kategoria obrażeń</Label>
            <Select value={category} onValueChange={v => setCategory(v as DamageType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as DamageType[]).map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <Checkbox checked={ranged} onCheckedChange={c => setRanged(c === true)} /> Atak dystansowy (test trafienia)
          </label>
          {ranged && (
            <>
              <NumberField label="Precyzja" value={precision} onChange={setPrecision} />
              <NumberField label="Ranga precyzji" value={precisionGrade} onChange={setPrecisionGrade} min={1} />
              <NumberField label="Refleks celu" value={reflex} onChange={setReflex} />
              <NumberField label="ST odległości" value={distanceST} onChange={setDistanceST} />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-base">Obrona celu</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <NumberField label="Blokowanie" value={block} onChange={setBlock} />
          <NumberField label="Parowanie" value={parry} onChange={setParry} />
          <NumberField label="Unik" value={dodge} onChange={setDodge} />
          <NumberField label="Pancerz" value={protection} onChange={setProtection} />
          <NumberField label="Odporność" value={resistance} onChange={setResistance} />
          <NumberField label="Niewrażliwość (kości)" value={immunity} onChange={setImmunity} min={0} />
          <NumberField label="HP celu" value={targetHp} onChange={setTargetHp} min={1} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-base">Wynik ({result.samples} prób)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Metric label="Śr. obrażenia (surowe)" value={result.expectedRaw.toFixed(1)} />
          <Metric label="Śr. zadane" value={result.expectedDealt.toFixed(1)} />
          <Metric label="Szansa krytyka" value={`${(result.critRate * 100).toFixed(0)}%`} />
          <Metric label="Trafienie" value={result.hitChance === null ? "zawsze" : `${(result.hitChance * 100).toFixed(0)}%`} />
          <Metric label="Trafień do zabicia" value={result.ttk === null ? "∞" : String(result.ttk)} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader><CardTitle className="text-base">Rozkład zadanych obrażeń</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={result.distribution} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.2)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={40} />
              <Tooltip cursor={{ fill: "hsl(0 0% 50% / 0.1)" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberField({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min?: number })
{
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={e => {
          const n = Number(e.target.value);
          onChange(Number.isNaN(n) ? (min ?? 0) : min !== undefined ? Math.max(min, n) : n);
        }}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string })
{
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
