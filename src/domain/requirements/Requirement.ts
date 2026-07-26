/**
 * Structured requirement model (Wave 5 — Requirements System Refactor, 5.1).
 *
 * Replaces the free-text `requirements: string[]` that lives today on Perks,
 * Spells, Maneuvers, Stances and States. Two variants:
 *
 *  - `rankless`: a normalized free-text requirement — preserves today's
 *    behaviour for anything that cannot (yet) be expressed structurally.
 *  - `ranked`:   a typed requirement pointing at a Characteristic, Attribute,
 *    Maneuver, Stance, State, Spell or Perk with a minimum `value` (rank).
 *
 * This type is additive: it is stored in a NEW `structuredRequirements` field
 * alongside the legacy `requirements: string[]`, which stays untouched until a
 * later migration wave retires it.
 */

import type { SkillGroup } from "@/domain/characters/statistics/skills";

/** Groups a `ranked` requirement can point at. */
export type RequirementTargetGroup =
  | "maneuvers"
  | "stances"
  | "states"
  | "spells"
  | "perks"
  | "talents"
  | "powers"
  | "derived"
  | "equipment"
  | "characteristics"
  | "attributes";

/** Groups whose `targetKey` is a statistic key (from `SKILLS`). */
export type StatisticRequirementGroup = Extract<RequirementTargetGroup, SkillGroup>;

/**
 * Groups whose `targetKey` is a Power TYPE rather than a name or a stat key
 * (Wave 7.2). Kept separate because the comparison reads `Power.level`, not a
 * `Statistic` and not an owned entity's `grade`.
 */
export type PowerRequirementGroup = "powers";

/**
 * Groups whose `targetKey` names a value COMPUTED from the character rather than
 * stored on it (Wave 7.6). First member: `spellStrength` — „siła zaklęcia",
 * rendered across the app as `Power.level + Power.bonus`.
 */
export type DerivedRequirementGroup = "derived";

/**
 * Computed targets, with the Polish label the rest of the app already uses.
 * `boolean` marks a yes/no property — printing „≥ 1" next to it says nothing.
 */
export const DERIVED_TARGETS: readonly { key: string; label: string; boolean?: true }[] = [
  { key: "spellStrength", label: "siła zaklęcia" },
  { key: "dodge", label: "unikanie" },
  { key: "parry", label: "parowanie" },
  { key: "recoveryLevel", label: "poziom leczenia" },
  { key: "toughness", label: "twardość" },
  // Fighting style, not a stat: satisfied when an offence carries a second
  // weapon. "Dwa miecze" and "wymagana broń w obu rękach" both mean this.
  { key: "dualWield", label: "walka dwiema broniami", boolean: true },
  // Weapon dice, read off the character's offences: „minimalna ranga kości broni
  // to 5" and „co najmniej jedna widmowa kość obrażeń".
  { key: "weaponDiceGrade", label: "ranga kości broni" },
  { key: "phantomDamage", label: "widmowa kość obrażeń", boolean: true },
];

/**
 * Equipment is required by CATEGORY, never by a specific item (Wave 8.2): the
 * library asks for "lekka zbroja" or "co najmniej średnia tarcza", not for a
 * named sword.
 */
export type EquipmentRequirementGroup = "equipment";

/**
 * An equipment category.
 *
 * `tiers` marks an ORDERED scale, where `value` is the minimum tier (1-based) —
 * "co najmniej średnia tarcza" is tier 3. Categories without `tiers` are plain
 * membership: owning one item of that kind satisfies them, whatever `value` says.
 *
 * Shields are scaled by their `block`, not by a tag: all eleven shields in the
 * library have empty tags and carry their size only in the name, while `block`
 * already encodes it (Puklerz 5 → Mała 7 → Średnia 9 → Duża 11 → Pawęż 13) and
 * also covers the six magical shields whose names say nothing about size.
 */
export type EquipmentTarget = {
  key: string;
  label: string;
  /** Which owned collection to look in. */
  slot: "armors" | "shields" | "weapons";
  /** Tag that identifies the category, for tag-based slots. */
  tag?: string;
  /** Ordered tier names (tag-based) — index + 1 is the tier number. */
  tiers?: readonly string[];
  /** Ordered `block` upper bounds, for shields. */
  blockTiers?: readonly number[];
  /**
   * Human-readable tier adjectives, so a requirement reads „co najmniej średnia
   * tarcza" instead of the meaningless „tarcza ≥ 3".
   */
  tierLabels?: readonly string[];
  /** Weapon `style` that identifies the category, instead of a tag. */
  style?: string;
  /**
   * Weapon name fragment, for kinds the library names but does not tag —
   * „kopia" and „szpony" are weapon types with no tag of their own.
   */
  nameFragment?: string;
};

export const EQUIPMENT_TARGETS: readonly EquipmentTarget[] = [
  // Armour weights are EXACT categories, not a scale (Marek 2026-07-25): „lekka
  // zbroja" means light armour specifically, and heavy does not satisfy it.
  // „Lekka lub średnia zbroja" is expressed as an alternative of two of these.
  { key: "armor.lekka", label: "lekka zbroja", slot: "armors", tag: "lekkie" },
  { key: "armor.średnia", label: "średnia zbroja", slot: "armors", tag: "średnie" },
  { key: "armor.ciężka", label: "ciężka zbroja", slot: "armors", tag: "ciężkie" },
  // Shields ARE a threshold: „co najmniej średnia tarcza" means średnia, duża or
  // pawęż. Every requirement text for shields spells out „co najmniej".
  {
    key: "shield", label: "tarcza", slot: "shields",
    blockTiers: [5, 7, 9, 11],
    tierLabels: ["puklerz", "mała", "średnia", "duża", "pawęż"],
  },
  { key: "weapon.dwuręczna", label: "broń dwuręczna", slot: "weapons", style: "Dwuręczny" },
  { key: "weapon.jednoręczna", label: "broń jednoręczna", slot: "weapons", style: "Jednoręczny" },
  // Named weapon kinds: the library asks for them by name and no tag isolates
  // them ("Kopia" is tagged kłute+drzewcowe like several other polearms).
  { key: "weapon.kopia", label: "kopia", slot: "weapons", nameFragment: "kopia" },
  { key: "weapon.szpony", label: "szpony", slot: "weapons", nameFragment: "szpony" },
  { key: "weapon.miecze", label: "miecz", slot: "weapons", tag: "miecze" },
  { key: "weapon.topory", label: "topór", slot: "weapons", tag: "topory" },
  { key: "weapon.obuchowe", label: "broń obuchowa", slot: "weapons", tag: "obuchowe" },
  { key: "weapon.drzewcowe", label: "broń drzewcowa", slot: "weapons", tag: "drzewcowe" },
  { key: "weapon.kłute", label: "broń kłuta", slot: "weapons", tag: "kłute" },
  { key: "weapon.sieczne", label: "broń sieczna", slot: "weapons", tag: "sieczne" },
  { key: "weapon.krótkie", label: "broń krótka", slot: "weapons", tag: "krótkie" },
  { key: "weapon.puginały", label: "puginał", slot: "weapons", tag: "puginały" },
  { key: "weapon.dystansowe", label: "broń dystansowa", slot: "weapons", tag: "dystansowe" },
  // New category (Marek 2026-07-25). No weapon carries this tag yet — tagging
  // the library is a data task, and until it happens the requirement simply
  // matches nothing rather than matching the wrong thing.
  { key: "weapon.krótkodystansowe", label: "broń krótkodystansowa", slot: "weapons", tag: "krótkodystansowe" },
  { key: "weapon.łuki", label: "łuk", slot: "weapons", tag: "łuki" },
  { key: "weapon.kusze", label: "kusza", slot: "weapons", tag: "kusze" },
  { key: "weapon.miotane", label: "broń miotana", slot: "weapons", tag: "miotane" },
  { key: "weapon.szermiercze", label: "broń szermiercza", slot: "weapons", tag: "szermiercze" },
  { key: "weapon.łańcuchowe", label: "broń łańcuchowa", slot: "weapons", tag: "łańcuchowe" },
  { key: "weapon.naręczne", label: "broń naręczna", slot: "weapons", tag: "naręczne" },
];

/** Groups whose `targetKey` is a Kompendium entity or Talent `name`. */
export type EntityRequirementGroup =
  Exclude<RequirementTargetGroup, SkillGroup | PowerRequirementGroup | DerivedRequirementGroup | EquipmentRequirementGroup>;

/** Normalized free-text requirement — today's behaviour, kept for anything unstructured. */
export type RanklessRequirement = { kind: "rankless"; text: string };

/**
 * Typed requirement with a minimum rank.
 * - `characteristics` / `attributes`: `targetKey` is a statistic key
 *   (e.g. "strength", "fencing"); `value` compares against the character's
 *   total test value for that statistic.
 * - `maneuvers` / `stances` / `states` / `spells` / `perks` / `talents`:
 *   `targetKey` is the entity (or Talent) `name`; `value` compares against the
 *   owned entity's `grade`.
 * - `powers`: `targetKey` is a Power TYPE ("moc" / "wiez"); `value` compares
 *   against `Power.level` — see `checkRequirement` for why `bonus` is excluded.
 */
export type RankedRequirement = {
  kind: "ranked";
  group: RequirementTargetGroup;
  targetKey: string;
  value: number;
};

/**
 * What an alternative may offer as one of its choices: anything EXCEPT another
 * composite. Free text is included because the library really does write
 * "Lekka lub średnia zbroja", where neither side is a structured target.
 *
 * No nesting, on purpose: Mongo's `$elemMatch` reaches exactly one level into
 * `options`, so an `anyOf` inside an `anyOf` would silently drop out of the
 * requirement filter — the same class of bug as Wave 7.7.
 */
export type AnyOfOption = RankedRequirement | RanklessRequirement | SumRequirement;

/**
 * Alternative (Wave 7.3) — satisfied when ANY option is. The motivating case is
 * "Moc 2 lub Więź 2": magic comes either from bloodline (Moc) or from a bond
 * with a deity (Więź), and either satisfies.
 */
export type AnyOfRequirement = { kind: "anyOf"; options: AnyOfOption[] };

/** One addend of a `sum` requirement. Statistics only — summing entity ranks is meaningless. */
export type StatisticTarget = { group: StatisticRequirementGroup; targetKey: string };

/**
 * Additive requirement (Wave 7.4) — "umysł + zręczność ≥ 10". Compares the sum
 * of the targets' total test values against `value`.
 *
 * Only `>=` exists, on purpose: a second comparison operator would double the
 * cases in every consumer listed on `checkRequirement`. "greater than 9" is
 * authored as `value: 10`.
 */
export type SumRequirement = { kind: "sum"; targets: StatisticTarget[]; value: number };

/**
 * Count requirement (Wave 8.1) — "own at least N of a kind". The library writes
 * these as "ilość postaw 4", "dwa widmowe manewry" or "pięć atutów ofensywnych
 * na poziomie co najmniej 2", which is why all three knobs exist:
 *
 * - `groups`  — which owned collections to count over (several at once, because
 *   "ilość postaw i manewrów" spans two).
 * - `tag`     — optional tag filter; the library's tags carry the flavour
 *   ("widmowy", "okrzyki-bojowe", "girgeński", "ofensywa").
 * - `minGrade`— optional floor on each counted entity's own rank.
 */
export type CountRequirement = {
  kind: "count";
  groups: EntityRequirementGroup[];
  tag?: string;
  minGrade?: number;
  value: number;
};

export type Requirement = RanklessRequirement | RankedRequirement | AnyOfRequirement | SumRequirement | CountRequirement;

/** Polish plural for each countable group, used by `formatRequirement`. */
export const ENTITY_GROUP_LABELS: Readonly<Record<EntityRequirementGroup, string>> = {
  maneuvers: "manewry",
  stances: "postawy",
  states: "stany",
  spells: "zaklęcia",
  perks: "atuty",
  talents: "umiejętności",
};

/** All groups whose `targetKey` is a statistic key. */
export const STATISTIC_REQUIREMENT_GROUPS: readonly StatisticRequirementGroup[] = ["characteristics", "attributes"];

/** All groups whose `targetKey` is a Kompendium entity or Talent name. */
export const ENTITY_REQUIREMENT_GROUPS: readonly EntityRequirementGroup[] = ["maneuvers", "stances", "states", "spells", "perks", "talents"];

/** All groups whose `targetKey` is a Power type. */
export const POWER_REQUIREMENT_GROUPS: readonly PowerRequirementGroup[] = ["powers"];

/** All groups whose `targetKey` names a computed value. */
export const DERIVED_REQUIREMENT_GROUPS: readonly DerivedRequirementGroup[] = ["derived"];

/** All groups whose `targetKey` names an equipment category. */
export const EQUIPMENT_REQUIREMENT_GROUPS: readonly EquipmentRequirementGroup[] = ["equipment"];

export const REQUIREMENT_TARGET_GROUPS: readonly RequirementTargetGroup[] = [
  ...STATISTIC_REQUIREMENT_GROUPS,
  ...ENTITY_REQUIREMENT_GROUPS,
  ...POWER_REQUIREMENT_GROUPS,
  ...DERIVED_REQUIREMENT_GROUPS,
  ...EQUIPMENT_REQUIREMENT_GROUPS,
];

export function isRanked(requirement: Requirement): requirement is RankedRequirement
{
  return requirement.kind === "ranked";
}

export function isRankless(requirement: Requirement): requirement is RanklessRequirement
{
  return requirement.kind === "rankless";
}

export function isStatisticGroup(group: RequirementTargetGroup): group is StatisticRequirementGroup
{
  return group === "characteristics" || group === "attributes";
}

export function isPowerGroup(group: RequirementTargetGroup): group is PowerRequirementGroup
{
  return group === "powers";
}

export function isDerivedGroup(group: RequirementTargetGroup): group is DerivedRequirementGroup
{
  return group === "derived";
}

export function isEquipmentGroup(group: RequirementTargetGroup): group is EquipmentRequirementGroup
{
  return group === "equipment";
}

/**
 * Every `ranked` entry a requirement contains, flattened. Consumers that reason
 * about targets (filters, the mapping audit) use this so a new composite variant
 * cannot silently hide its targets from them.
 */
export function rankedEntriesOf(requirement: Requirement): RankedRequirement[]
{
  switch (requirement.kind)
  {
    case "ranked":
      return [requirement];
    case "anyOf":
      return requirement.options.filter((option): option is RankedRequirement => option.kind === "ranked");
    case "rankless":
    case "sum":
    case "count":
      return [];
  }
}
