/**
 * The machine-readable form of a stance/state ("postawa"/"stan"): the existing
 * `Mode` (name, grade, description, tags, effects) grouped into RANK FAMILIES.
 *
 * A stance library holds each rank as a separate record (e.g. "Ciężka Tarcza"
 * g1/g2/g3). "Raising the rank by 1" swaps to the grade+1 sibling's effects
 * (engine-model-gaps §1), so the simulation needs the whole family — not just
 * the active record. A `ModeFamily` bundles a name's variants keyed by grade.
 */

import type { Mode } from "@/domain/characters/combat/Mode";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

export type ModeDefinition = Mode &
{
  effects: Effect[];
};

/** One stance/state name with its rank variants (effects keyed by grade). */
export type ModeFamily =
{
  name: string;
  /** Effects for each authored grade of this name. */
  variantsByGrade: Record<number, Effect[]>;
  /** Sorted list of the grades that exist (ascending). */
  grades: number[];
};

/**
 * Lift a `Mode` to a `ModeDefinition`. A mode explicitly marked
 * `simulatable === false` (or with no authored effects) is lifted with an empty
 * list — present in the library but mechanically inert, exactly like maneuvers.
 */
export function toModeDefinition(mode: Mode): ModeDefinition
{
  const effects = mode.simulatable === false ? [] : (mode.effects ?? []);
  return { ...mode, effects };
}

/**
 * Group a flat list of modes (all grades of possibly several names) into rank
 * families keyed by name. Effects are taken from each record's authored effects
 * (empty for unsupported / unauthored). Higher grades overwrite lower ones only
 * if a name/grade pair repeats (last write wins; libraries have one per pair).
 */
export function groupModeFamilies(modes: Mode[]): ModeFamily[]
{
  const byName = new Map<string, Record<number, Effect[]>>();
  for (const mode of modes)
  {
    const def = toModeDefinition(mode);
    const variants = byName.get(mode.name) ?? {};
    variants[mode.grade] = def.effects;
    byName.set(mode.name, variants);
  }

  return [...byName.entries()].map(([name, variantsByGrade]) => ({
    name,
    variantsByGrade,
    grades: Object.keys(variantsByGrade).map(Number).sort((a, b) => a - b),
  }));
}

/**
 * The effects that apply for a family at an EFFECTIVE grade: the requested
 * grade, clamped to the highest authored variant at or below it, else the
 * lowest available. Used when a rank-up pushes past the top of the ladder.
 */
export function variantEffectsAt(family: ModeFamily, grade: number): Effect[]
{
  if (family.grades.length === 0) return [];
  const exact = family.variantsByGrade[grade];
  if (exact) return exact;
  // Clamp: highest grade ≤ requested, else the lowest that exists.
  const atOrBelow = family.grades.filter(g => g <= grade);
  const chosen = atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1]! : family.grades[0]!;
  return family.variantsByGrade[chosen] ?? [];
}
