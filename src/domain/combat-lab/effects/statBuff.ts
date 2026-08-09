/**
 * Turn an inline `StatBuffEffect` into a throwaway `BuffProfile` so the engine
 * can apply it through the SAME effectiveOffense/effectiveDefense path as a
 * profile-based buff. Keeps the "author flat deltas, no profile id needed"
 * ergonomics of the maneuver editor working end-to-end.
 */

import { createDefaultBuffProfile, type BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { StatBuffEffect } from "@/domain/combat-lab/effects/Effect";
import type { Attributes } from "@/domain/characters/statistics/Attributes";
import type { Characteristics } from "@/domain/characters/statistics/Characteristics";

/**
 * Test statistics an inline stat buff can shift, with their Polish names.
 *
 * ONE source for both `statEffectToProfile` and `statEffectDeltas` on purpose.
 * The profile `id` is built from the deltas, so a field added to the applier but
 * forgotten in the deltas would give two different buffs the SAME id — and they
 * would start quietly overwriting each other instead of stacking. Deriving both
 * from this map makes that mistake impossible rather than merely unlikely.
 *
 * `satisfies Record<keyof …>` is what forces completeness: a new attribute in
 * the character model fails to compile until it is named here.
 */
const ATTRIBUTE_LABELS =
{
  fencing: "fechtunek",
  artifice: "fortel",
  precision: "precyzja",
  initiative: "inicjatywa",
  martialArt: "walka wręcz",
  horsemanship: "jeździectwo",
  fortitude: "wytrwałość",
  reflex: "refleks",
  willpower: "wola",
} as const satisfies Record<keyof Attributes, string>;

const CHARACTERISTIC_LABELS =
{
  strength: "siła",
  dexterity: "zręczność",
  constitution: "budowa",
  mind: "umysł",
  charisma: "charyzma",
  spellborn: "czarokrwistość",
} as const satisfies Record<keyof Characteristics, string>;

export const STAT_BUFF_ATTRIBUTES = Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[];
export const STAT_BUFF_CHARACTERISTICS = Object.keys(CHARACTERISTIC_LABELS) as (keyof Characteristics)[];

/** Polish label for a test statistic — shared by the editor and descriptions. */
export function statBuffLabel(key: keyof Attributes | keyof Characteristics): string
{
  return (ATTRIBUTE_LABELS as Record<string, string>)[key] ?? (CHARACTERISTIC_LABELS as Record<string, string>)[key] ?? key;
}

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
  if (effect.critRange) profile.offense.leadingWeapon.criticalRange = effect.critRange;

  // Wszystko ląduje w `.value`, nigdy w `.testBonus`: podręcznikowe „zwiększa
  // fechtunek o 1" podnosi samą cechę, a premia tylko do testów rozjechałaby się
  // z kartą postaci.
  for (const key of STAT_BUFF_ATTRIBUTES)
  {
    const delta = effect[key];
    if (delta) profile.attributes[key].value = delta;
  }

  for (const key of STAT_BUFF_CHARACTERISTICS)
  {
    const delta = effect[key];
    if (delta) profile.characteristics[key].value = delta;
  }

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
    ["szansa krytyka", effect.critRange ?? 0],
    ["bez krytyka", effect.critDisabled ? 1 : 0],
    ["bariera", effect.barrier ?? 0],
    ...STAT_BUFF_ATTRIBUTES.map(key => [statBuffLabel(key), effect[key] ?? 0] as [string, number]),
    ...STAT_BUFF_CHARACTERISTICS.map(key => [statBuffLabel(key), effect[key] ?? 0] as [string, number]),
  ];
  return pairs.filter(([, v]) => v !== 0);
}
