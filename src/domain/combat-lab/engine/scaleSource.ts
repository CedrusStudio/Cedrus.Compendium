/**
 * Count a `ScaleSource` against the current combat state — the "za każde X"
 * quantity for a `ScaleEffect`. Pure; shared by the engine (applyEffect) and the
 * AI valuation (policyValue) so both agree on the count.
 */

import type { ScaleSource, DamageSpec } from "@/domain/combat-lab/effects/Effect";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import { selectDefaultOffense, selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { Offense } from "@/domain/characters/combat/Offense";
import type { Statistic } from "@/domain/characters/statistics/Statistic";

/** Number of real (non-empty) weapon/damage dice an offense rolls. */
function offenseDiceCount(offense: Offense): number
{
  let n = 0;
  const add = (c: { amount: number; grade: number } | undefined) => { if (c && c.grade > 0) n += c.amount; };
  add(offense.leadingWeapon);
  add(offense.secondaryWeapon);
  add(offense.damageBonus);
  add(offense.additionalDamageBonus);
  return n;
}

const stacksOf = (runtime: CombatantRuntime, status: string): number =>
  runtime.statuses.filter(s => s.status === status).reduce((n, s) => n + s.stacks, 0);

/** A stat's magnitude (value + bonus, excluding the test-only testBonus), ≥ 0. */
function statMagnitude(runtime: CombatantRuntime, group: "attributes" | "characteristics", key: string): number
{
  const st = (runtime.snapshot.skills[group] as Record<string, Statistic>)[key];
  return st ? Math.max(0, st.value + st.bonus) : 0;
}

export function countScaleSource(source: ScaleSource, self: CombatantRuntime, target: CombatantRuntime): number
{
  switch (source.kind)
  {
    case "selfDice":
    {
      const off = selectDefaultOffense(self.snapshot);
      return off ? offenseDiceCount(off) : 0;
    }
    case "opponentDice":
    {
      const off = selectDefaultOffense(target.snapshot);
      return off ? offenseDiceCount(off) : 0;
    }
    case "opponentImmunity":
      return selectDefaultDefense(target.snapshot)?.immunity ?? 0;
    case "selfResource":
      return self.resources[source.resource];
    case "selfStatusStacks":
      return stacksOf(self, source.status);
    case "targetStatusStacks":
      return stacksOf(target, source.status);
    case "selfStat":
      return statMagnitude(self, source.group, source.key);
    case "opponentStat":
      return statMagnitude(target, source.group, source.key);
  }
}

/**
 * Resolve a `DamageSpec` whose dice rank is bound to a statistic ("kość równa
 * sile"): replace `grade` with the stat magnitude (floored ≥ 1) of the caster
 * (`who: "self"`, default) or target. A no-op for plain specs.
 */
export function resolveDamageSpecGrade(spec: DamageSpec, self: CombatantRuntime, target: CombatantRuntime): DamageSpec
{
  if (!spec.gradeFromStat) return spec;
  const rt = spec.gradeFromStat.who === "target" ? target : self;
  const grade = Math.max(1, statMagnitude(rt, spec.gradeFromStat.group, spec.gradeFromStat.key));
  return { ...spec, grade };
}

/** How many times a scale effect applies: floor(count / per), capped. */
export function scaleTimes(count: number, per?: number, cap?: number): number
{
  let times = Math.floor(count / Math.max(1, per ?? 1));
  if (cap !== undefined) times = Math.min(times, cap);
  return Math.max(0, times);
}
