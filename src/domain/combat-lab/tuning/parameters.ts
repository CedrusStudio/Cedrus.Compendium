/**
 * Parameter Tuning: apply global parameter deltas to a combatant snapshot and
 * measure how the balance shifts (Win Rate / fight length / winner hp). Lets you
 * ask "what happens if I bump damage by +1?" without editing any character.
 *
 * Overrides are expressed as flat deltas and layered onto the snapshot's
 * offense/defense (via the app's buff appliers) + hp, non-destructively.
 *
 * Pure domain, built on `runSimulation`; deterministic.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { createDefaultBuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { applyOffenseBuff, applyDefenseBuff } from "@/domain/characters/buffs/applyBuffProfile";
import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";

export type ParameterOverrides =
{
  /** Flat bonus to offense damage. */
  damageBonus: number;
  /** Delta to the leading weapon die grade. */
  diceGrade: number;
  /** Delta to critical power / range. */
  critPower: number;
  critRange: number;
  /** Deltas to defensive layers. */
  block: number;
  parry: number;
  dodge: number;
  protection: number;
  resistance: number;
  /** Delta to max hp. */
  hp: number;
};

export const NO_OVERRIDES: ParameterOverrides = {
  damageBonus: 0, diceGrade: 0, critPower: 0, critRange: 0,
  block: 0, parry: 0, dodge: 0, protection: 0, resistance: 0, hp: 0,
};

/** Build a `BuffProfile` carrying the offense/defense deltas (hp handled separately). */
export function overridesToBuffProfile(overrides: ParameterOverrides): BuffProfile
{
  const base = structuredClone(createDefaultBuffProfile()) as BuffProfile;
  const profile: BuffProfile = { ...base, id: "tuning", name: "tuning" };

  profile.offense.damageBonus.bonus = overrides.damageBonus;
  profile.offense.leadingWeapon.grade = overrides.diceGrade;
  profile.offense.leadingWeapon.criticalPower = overrides.critPower;
  profile.offense.leadingWeapon.criticalRange = overrides.critRange;

  profile.defense.block = overrides.block;
  profile.defense.parry = overrides.parry;
  profile.defense.dodge = overrides.dodge;
  profile.defense.protection = overrides.protection;
  profile.defense.resistance = overrides.resistance;

  return profile;
}

/** Return a new snapshot with the overrides applied to offense/defense and hp. */
export function applyOverrides(snapshot: CombatantSnapshot, overrides: ParameterOverrides): CombatantSnapshot
{
  const profile = overridesToBuffProfile(overrides);
  return {
    ...snapshot,
    maxHp: Math.max(1, snapshot.maxHp + overrides.hp),
    offenses: snapshot.offenses.map(o => applyOffenseBuff(o, profile)),
    defenses: snapshot.defenses.map(d => applyDefenseBuff(d, profile.defense)),
  };
}

export type TuningStats =
{
  winRate: number;
  averageRounds: number;
  averageWinnerHp: number;
};

export type TuningResult =
{
  baseline: TuningStats;
  tuned: TuningStats;
  winRateDelta: number;
  count: number;
};

export type TuningOptions =
{
  count: number;
  seedStart?: number;
  subjectPolicy?: ActionPolicy;
  opponentPolicy?: ActionPolicy;
  maxRounds?: number;
};

/**
 * Compare the subject with vs. without the overrides against a fixed opponent.
 */
export function compareTuning(
  subject: CombatantSnapshot,
  opponent: CombatantSnapshot,
  overrides: ParameterOverrides,
  options: TuningOptions,
): TuningResult
{
  const baseline = statsFor(subject, opponent, options);
  const tuned = statsFor(applyOverrides(subject, overrides), opponent, options);
  return { baseline, tuned, winRateDelta: tuned.winRate - baseline.winRate, count: options.count };
}

function statsFor(subject: CombatantSnapshot, opponent: CombatantSnapshot, options: TuningOptions): TuningStats
{
  const { summary } = runSimulation({
    a: subject,
    b: opponent,
    count: options.count,
    seedStart: options.seedStart ?? 0,
    policyA: options.subjectPolicy,
    policyB: options.opponentPolicy,
    maxRounds: options.maxRounds,
  });
  return {
    winRate: summary.winRates[subject.id] ?? 0,
    averageRounds: summary.averageRounds,
    averageWinnerHp: summary.averageWinnerHp,
  };
}
