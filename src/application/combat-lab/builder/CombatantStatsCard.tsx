"use client";

/**
 * Read-only preview of the exact snapshot going into the simulation — the built
 * combatant AFTER attack mode + active/temporary buffs are applied. Lets you
 * sanity-check who is actually fighting.
 */

import { ChevronDown } from "lucide-react";
import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { selectDefaultOffense, selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { toOffenseString } from "@/domain/characters/combat/Offense";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { Card, CardContent } from "@/common/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/common/components/ui/collapsible";

const ATTACK_KIND_LABELS: Record<string, string> = { melee: "zwarcie", rangedPhysical: "dystans fizyczny", rangedMagic: "dystans magiczny" };

export function CombatantStatsCard({ title, snapshot }: { title: string; snapshot: CombatantSnapshot })
{
  const offense = selectDefaultOffense(snapshot);
  const defense = selectDefaultDefense(snapshot);

  const summary = [
    ATTACK_KIND_LABELS[snapshot.attackKind] ?? snapshot.attackKind,
    `${snapshot.maxHp} HP`,
    `${snapshot.maneuvers.length} manewrów`,
    ...(snapshot.spells.length > 0 ? [`${snapshot.spells.length} zaklęć`] : []),
  ].join(" · ");

  return (
    <Card className="flex-1 min-w-[260px]">
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-6 py-3 text-left [&[data-state=open]_svg]:rotate-180">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{title}: {snapshot.name}</span>
            <span className="text-xs text-muted-foreground">{summary}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col gap-2 pt-0 text-sm">
        <Row label="Tryb ataku" value={ATTACK_KIND_LABELS[snapshot.attackKind] ?? snapshot.attackKind} />
        <Row label="HP" value={`${snapshot.maxHp}${snapshot.barrier > 0 ? ` (+${snapshot.barrier} bariery)` : ""}`} />
        {(snapshot.lethalHealth > 0 || snapshot.lethalRounds > 0) && (
          <Row label="Przeżywalność / determinacja" value={`${snapshot.lethalHealth} / ${snapshot.lethalRounds}`} />
        )}

        {offense && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Atak</div>
            <div>{toOffenseString(offense.leadingWeapon) || "—"}
              {offense.secondaryWeapon ? ` + ${toOffenseString(offense.secondaryWeapon)}` : ""}
              {offense.damageBonus.amount > 0 || offense.damageBonus.bonus !== 0 ? ` +bonus ${toOffenseString(offense.damageBonus)}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">krytyk: szansa {offense.leadingWeapon.critical.range}, siła {offense.leadingWeapon.critical.power}</div>
          </div>
        )}

        {defense && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Obrona</div>
            <div className="text-xs">blok {defense.block} · parowanie {defense.parry} · unik {defense.dodge} · pancerz {defense.protection} · odporność {defense.resistance} · niewrażliwość {defense.immunity}</div>
          </div>
        )}

        <Row label="Inicjatywa / precyzja / refleks" value={`${getStatisticTotalTestValue(snapshot.initiative)} / ${getStatisticTotalTestValue(snapshot.precision)} / ${getStatisticTotalTestValue(snapshot.reflex)}`} />

        {(snapshot.stance || snapshot.state) && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Tryby</div>
            <div className="text-xs">
              {snapshot.stance && <span>postawa: {snapshot.stance.name} g{snapshot.stance.baseGrade}</span>}
              {snapshot.stance && snapshot.state && <span> · </span>}
              {snapshot.state && <span>stan: {snapshot.state.name} g{snapshot.state.baseGrade}</span>}
            </div>
          </div>
        )}

        {snapshot.spells.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground">Zaklęcia ({snapshot.spells.length})</div>
            <ul className="flex flex-col gap-0.5 text-xs">
              {snapshot.spells.map(s => (
                <li key={s.id}>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground"> — {toOffenseString(s.offense.leadingWeapon) || "—"}
                    {s.offense.damageBonus.amount > 0 || s.offense.damageBonus.bonus !== 0 ? ` +bonus ${toOffenseString(s.offense.damageBonus)}` : ""}
                    {` · koszt ${s.costEssence} esencji`}
                    {s.cooldown ? ` · odnowienie ${s.cooldown}` : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-muted-foreground">Manewry ({snapshot.maneuvers.length})</div>
          {snapshot.maneuvers.length === 0 ? (
            <div className="text-xs text-muted-foreground">brak</div>
          ) : (
            <ul className="flex flex-col gap-0.5 text-xs">
              {snapshot.maneuvers.map(m => (
                <li key={m.id}>
                  <span className="font-medium">{m.name}</span>
                  {m.simulatable === false
                    ? <span className="text-amber-600"> — niesymulowalny{m.unsupportedReason ? ` (${m.unsupportedReason})` : ""}</span>
                    : m.effects.length === 0
                      ? <span className="text-amber-600"> — brak efektów (nie zostanie użyty)</span>
                      : <span className="text-muted-foreground"> — {describeManeuver(m)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string })
{
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
