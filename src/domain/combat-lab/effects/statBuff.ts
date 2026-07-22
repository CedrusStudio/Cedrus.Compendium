/**
 * Turn an inline `StatBuffEffect` into a throwaway `BuffProfile` so the engine
 * can apply it through the SAME effectiveOffense/effectiveDefense path as a
 * profile-based buff. Keeps the "author flat deltas, no profile id needed"
 * ergonomics of the maneuver editor working end-to-end.
 */

import { createDefaultBuffProfile, type BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { StatBuffEffect } from "@/domain/combat-lab/effects/Effect";

export function statEffectToProfile(effect: StatBuffEffect): BuffProfile
{
  const base = createDefaultBuffProfile();
  // Deterministic id from the effect's content (mode + non-zero deltas), so that
  // re-applying the SAME inline buff refreshes its duration instead of stacking
  // a second copy (Entity.id is readonly → set it via spread, not assignment).
  const id = `stat:${effect.mode}:` + statEffectDeltas(effect).map(([label, value]) => `${label}=${value}`).join(",");
  const profile: BuffProfile = { ...base, id };
  profile.name = effect.mode === "self" ? "Manewr — wzmocnienie" : "Manewr — osłabienie";

  if (effect.block) profile.defense.block = effect.block;
  if (effect.parry) profile.defense.parry = effect.parry;
  if (effect.dodge) profile.defense.dodge = effect.dodge;
  if (effect.protection) profile.defense.protection = effect.protection;
  if (effect.resistance) profile.defense.resistance = effect.resistance;
  if (effect.immunity) profile.defense.immunity = effect.immunity;

  if (effect.damage) profile.offense.damageBonus.bonus = effect.damage;
  if (effect.diceGrade) profile.offense.leadingWeapon.grade = effect.diceGrade;
  if (effect.critPower) profile.offense.leadingWeapon.criticalPower = effect.critPower;

  if (effect.precision) profile.attributes.precision.value = effect.precision;
  if (effect.reflex) profile.attributes.reflex.value = effect.reflex;
  if (effect.initiative) profile.attributes.initiative.value = effect.initiative;

  if (effect.barrier) profile.health.barrier = effect.barrier;

  return profile;
}

/** Non-zero deltas as `[polishLabel, value]` pairs — used for descriptions/value. */
export function statEffectDeltas(effect: StatBuffEffect): [string, number][]
{
  const pairs: [string, number][] = [
    ["blok", effect.block ?? 0],
    ["parowanie", effect.parry ?? 0],
    ["unik", effect.dodge ?? 0],
    ["pancerz", effect.protection ?? 0],
    ["odporność", effect.resistance ?? 0],
    ["niewrażliwość", effect.immunity ?? 0],
    ["obrażenia", effect.damage ?? 0],
    ["ranga kości", effect.diceGrade ?? 0],
    ["siła krytyka", effect.critPower ?? 0],
    ["precyzja", effect.precision ?? 0],
    ["refleks", effect.reflex ?? 0],
    ["inicjatywa", effect.initiative ?? 0],
    ["bariera", effect.barrier ?? 0],
  ];
  return pairs.filter(([, v]) => v !== 0);
}
