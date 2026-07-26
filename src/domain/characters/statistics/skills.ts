/**
 * Canonical list of character "skills" usable in test pools and requirements:
 * `[group, key, PL]` where `group` is the statistic family, `key` is the
 * domain key from `Characteristics.ts`/`Attributes.ts` (e.g. "strength",
 * "fencing") and `PL` is the Polish label.
 *
 * Lives in `src/domain` so both the domain layer (requirements engine) and the
 * application layer (Combat Lab effect editor, requirement picker) can share it
 * without the application → domain dependency pointing the wrong way. The
 * Combat Lab editor re-exports this as `SKILLS` from `effectFieldsMeta.ts`.
 */

export type SkillGroup = "attributes" | "characteristics";

export type SkillEntry = readonly [group: SkillGroup, key: string, pl: string];

export const SKILLS: readonly SkillEntry[] = [
  ["attributes", "fencing", "fechtunek"], ["attributes", "artifice", "fortel"], ["attributes", "precision", "precyzja"],
  ["attributes", "initiative", "inicjatywa"], ["attributes", "martialArt", "walka wręcz"], ["attributes", "horsemanship", "jeździectwo"],
  ["attributes", "fortitude", "wytrwałość"], ["attributes", "reflex", "refleks"], ["attributes", "willpower", "wola"],
  ["characteristics", "strength", "siła"], ["characteristics", "dexterity", "zręczność"], ["characteristics", "constitution", "budowa"],
  ["characteristics", "mind", "umysł"], ["characteristics", "charisma", "charyzma"], ["characteristics", "spellborn", "czarokrwistość"],
];
