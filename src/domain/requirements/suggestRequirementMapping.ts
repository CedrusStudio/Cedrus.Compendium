/**
 * Suggestion engine for migrating legacy free-text requirements to `ranked`
 * (Wave 5, 5.4.2; reordered in Wave 7.5). Given a `rankless` text it tries to
 * guess a structured requirement — a stat/attribute or a named Kompendium
 * entity + a minimum rank pulled out of the text. It is a human-in-the-loop
 * accelerator: it returns a *suggestion* an editor approves or rejects, never an
 * automatic production write.
 *
 * Matching is intentionally conservative (normalized exact / word match) rather
 * than aggressive fuzzy logic — a wrong silent guess is worse than no guess,
 * because the fallback (staying `rankless`) is always safe.
 *
 * ## Priority: the most specific match wins (Wave 7.5)
 *
 * Tiers are tried in order and a lower tier is only consulted when every higher
 * one comes up empty:
 *
 *   1. exact entity name  — "większy fechtunek" → the Atut of that name
 *   2. exact statistic    — "siła" → characteristics/strength
 *   3. statistic by word  — "wymaga siła" → characteristics/strength
 *
 * The original order asked tier 3 *first*, which quietly wrecked every
 * multi-word entity whose name contains a stat word. Measured against the
 * 2026-07-19 backup that was **298 requirement occurrences across 48 distinct
 * texts** — "Większy Fechtunek 5" (a rank-1..12 Atut, "Bazowy Fechtunek +N")
 * became `attributes/fencing ≥ 5`, "Siła Krytyka 2" became
 * `characteristics/strength ≥ 2`, and so on. No entity in the library is named
 * exactly like a statistic, so putting entity names first is unambiguously safe.
 *
 * Ambiguity is reported, never resolved: when a tier yields several readings in
 * different groups (e.g. "akrobatyka" is both a Talent and a Maneuver) the
 * engine returns no suggestion and hands the candidates to the editor.
 */

import { SKILLS } from "@/domain/characters/statistics/skills";
import { normalizePowerType } from "@/domain/characters/combat/Power";
import { normalizeRequirementText } from "@/domain/requirements/normalizeRequirementText";
import {
  ENTITY_REQUIREMENT_GROUPS,
  EQUIPMENT_TARGETS,
  type AnyOfRequirement,
  type CountRequirement,
  type EntityRequirementGroup,
  type StatisticTarget,
  type SumRequirement,
  type RankedRequirement,
  rankedEntriesOf,
} from "@/domain/requirements/Requirement";

export type EntityNameOptions = Partial<Record<EntityRequirementGroup, readonly string[]>>;

/**
 * Shorthand the library actually uses in requirement texts — "S 3", "Zr 2".
 * Confirmed by Marek 2026-07-25.
 */
const STATISTIC_ABBREVIATIONS: readonly [abbreviation: string, key: string][] = [
  ["s", "strength"],
  ["zr", "dexterity"],
  ["bd", "constitution"],
  ["um", "mind"],
  ["ch", "charisma"],
  ["cz", "spellborn"],
  // Marek 2026-07-25: "Ck" / "Ckr" are also czarokrwistość.
  ["ck", "spellborn"],
  ["ckr", "spellborn"],
];

/** Shorthand for computed values. "SZ 6" = siła zaklęcia ≥ 6 (74 occurrences). */
const DERIVED_ABBREVIATIONS: readonly [abbreviation: string, key: string][] = [
  ["sz", "spellStrength"],
];

/**
 * Full wording for computed values, checked before single-word statistic
 * matching. Several spellings per target because the books are not consistent —
 * "uniki", "unik" and "unikanie" all mean the same defence value.
 */
const DERIVED_PHRASES: readonly [phrase: string, key: string][] = [
  // Marek: "dwa miecze" is shorthand for the two-weapon fighting style.
  ["dwa miecze", "dualWield"],
  ["broń w obu rękach", "dualWield"],
  ["wymagana broń w obu rękach", "dualWield"],
  ["siła zaklęcia", "spellStrength"],
  ["siły zaklęcia", "spellStrength"],
  ["unikanie", "dodge"],
  ["uniki", "dodge"],
  ["unik", "dodge"],
  ["uników", "dodge"],
  ["parowanie", "parry"],
  ["parowania", "parry"],
  ["poziom leczenia", "recoveryLevel"],
  ["poziomu leczenia", "recoveryLevel"],
  ["twardość", "toughness"],
  ["twardosc", "toughness"],
];

/**
 * Wording that means an existing target under a different name. Kept tiny and
 * explicit rather than fuzzy: every entry is a deliberate editorial decision.
 */
const REQUIREMENT_SYNONYMS: Readonly<Record<string, string>> = {
  // Marek: "ciche poruszanie" is how the books phrase the Talent "skradanie".
  "ciche poruszanie": "skradanie",
};

/** Texts that name magic generically — satisfied by either source of power. */
const ANY_POWER_WORDS = new Set(["moc", "magia"]);

/** Polish number words the count texts use ("dwa widmowe manewry"). */
const NUMBER_WORDS: Readonly<Record<string, number>> = {
  "jeden": 1, "jedna": 1, "jednego": 1,
  "dwa": 2, "dwie": 2, "dwóch": 2,
  "trzy": 3, "trzech": 3,
  "cztery": 4, "czterech": 4,
  "pięć": 5, "pieć": 5, "pięciu": 5,
  "sześć": 6, "szesc": 6,
  "siedem": 7, "osiem": 8, "dziewięć": 9, "dziesięć": 10,
};

/**
 * Words that name a countable group, in every inflected form the library uses.
 * "manewrów", "manewry", "manewr" all point at `maneuvers`.
 */
const COUNT_GROUP_WORDS: readonly [stem: string, group: EntityRequirementGroup][] = [
  ["manewr", "maneuvers"],
  ["postaw", "stances"],
  ["stan", "states"],
  ["zaklę", "spells"],
  ["atut", "perks"],
  ["umiejętnoś", "talents"],
];

/**
 * Adjectives the count texts use, mapped to the tag that actually exists on the
 * entities. Verified against the library: `widmowy` (93 maneuvers),
 * `okrzyki-bojowe` (44), `girgeński` (10), `fechtunek` (93), `tarcze` (19),
 * `ofensywa` (120 perks).
 */
/** Words that explicitly announce a count, letting a tag stand in for the group. */
const COUNT_CUE_WORDS: readonly string[] = ["ilość", "ilosc", "liczba", "liczbę", "liczbe"];

/**
 * Phrasings that NEGATE or exclude. Any of them and the engine stays silent:
 * "cecha inna niż czarokrwistość" was being suggested as
 * `characteristics/spellborn ≥ 1` — the exact opposite of what it says.
 */
const NEGATION_PATTERNS: readonly RegExp[] = [
  /\binn[ayeą]\s+ni[żz]\b/,
  /\bni[żz]\s/,
  /^brak\b/,
  /\bbez\b/,
  /\bnie\b/,
];

/** "na randze 3" / "na poziomie co najmniej 2" — a floor on each counted entity. */
const GRADE_QUALIFIER = /\bna\s+(?:randze|poziomie)\s+(?:co\s+najmniej\s+)?(-?\d+)/;

const COUNT_TAG_WORDS: readonly [word: string, tag: string, defaultGroup: EntityRequirementGroup][] = [
  ["widmow", "widmowy", "maneuvers"],
  ["okrzyk", "okrzyki-bojowe", "maneuvers"],
  ["girgeń", "girgeński", "maneuvers"],
  ["girgen", "girgeński", "maneuvers"],
  ["fechtunk", "fechtunek", "maneuvers"],
  ["tarcz", "tarcze", "maneuvers"],
  ["ofensyw", "ofensywa", "perks"],
];

/** Extract the first integer in the text, if any. */
export function extractRequirementValue(text: string): number | undefined
{
  const match = text.match(/-?\d+/);
  return match ? Number.parseInt(match[0], 10) : undefined;
}

/** The text with any digits (and the surrounding padding) stripped and collapsed. */
function nameCandidate(normalized: string): string
{
  return normalized.replace(/-?\d+/g, " ").replace(/\s+/g, " ").trim();
}

/** Tier 1 — the candidate IS an entity name. Collects every group that matches. */
function matchEntitiesExact(candidate: string, entityNames: EntityNameOptions, value: number): RankedRequirement[]
{
  const matches: RankedRequirement[] = [];

  for (const group of ENTITY_REQUIREMENT_GROUPS)
  {
    const names = entityNames[group];
    if (!names) continue;

    const hit = names.find((name) => normalizeRequirementText(name) === candidate);
    if (hit)
    {
      matches.push({ kind: "ranked", group, targetKey: hit, value });
    }
  }

  return matches;
}

/** Tier 2 — the candidate IS a statistic label or key. */
function matchStatisticExact(candidate: string, value: number): RankedRequirement[]
{
  for (const [group, key, pl] of SKILLS)
  {
    if (candidate === pl || candidate === key)
    {
      return [{ kind: "ranked", group, targetKey: key, value }];
    }
  }

  return [];
}

/** Tier 2b — a Power type, including the aliases `normalizePowerType` knows. */
function matchPowerType(candidate: string, value: number): RankedRequirement[]
{
  if (!["moc", "wiez", "więź", "arkana", "wiara", "natura"].includes(candidate))
  {
    return [];
  }

  return [{ kind: "ranked", group: "powers", targetKey: normalizePowerType(candidate), value }];
}

/**
 * Tier 3 — a statistic word appears inside a longer phrase ("wymaga siła 5").
 * Last resort by design: this is the loosest rule in the engine and the one that
 * used to swallow entity names whole.
 */
function matchStatisticByWord(candidate: string, value: number): RankedRequirement[]
{
  const words = candidate.split(" ");

  for (const [group, key, pl] of SKILLS)
  {
    if (words.includes(pl) || words.includes(key))
    {
      return [{ kind: "ranked", group, targetKey: key, value }];
    }
  }

  return [];
}

/**
 * Tier 4 — shorthand, and only when the WHOLE text is `abbreviation + number`.
 *
 * Anchoring to the whole string is the entire safety story: "s" would otherwise
 * match inside any phrase containing a stray "s" token, and a wrong silent guess
 * is exactly what this engine exists to avoid.
 */
function matchAbbreviation(normalized: string, value: number): RankedRequirement[]
{
  const match = normalized.match(/^([a-ząćęłńóśźż]{1,3})\s*-?\d+$/);
  if (!match)
  {
    return [];
  }

  const statistic = STATISTIC_ABBREVIATIONS.find(([abbreviation]) => abbreviation === match[1]);
  if (statistic)
  {
    return [{ kind: "ranked", group: "characteristics", targetKey: statistic[1], value }];
  }

  const derived = DERIVED_ABBREVIATIONS.find(([abbreviation]) => abbreviation === match[1]);
  if (derived)
  {
    return [{ kind: "ranked", group: "derived", targetKey: derived[1], value }];
  }

  return [];
}

/**
 * Tier 1b — a computed value spelled out in full. Must run before the
 * single-word statistic match, or „siła zaklęcia 6" would be read as
 * `characteristics/strength` on the strength of the word „siła" alone.
 */
function matchDerivedPhrase(candidate: string, value: number): RankedRequirement[]
{
  const hit = DERIVED_PHRASES.find(([phrase]) => phrase === candidate);
  return hit ? [{ kind: "ranked", group: "derived", targetKey: hit[1], value }] : [];
}

export type MappingSuggestion =
{
  /** The one confident reading, or `null` when nothing matched or it is ambiguous. */
  suggestion: RankedRequirement | AnyOfRequirement | CountRequirement | SumRequirement | null;
  /** Every plausible reading from the winning tier, in group order. */
  candidates: RankedRequirement[];
  /** `true` when several groups claim the same text — the editor must choose. */
  ambiguous: boolean;
};

/**
 * A bare "Moc 2" does not say which source the magic comes from, and either
 * qualifies — bloodline (Moc) or a bond with a deity (Więź). That is an
 * alternative, not a guess between two options, so it is returned as one.
 */
function suggestAnyPower(candidate: string, value: number): AnyOfRequirement | null
{
  if (!ANY_POWER_WORDS.has(candidate))
  {
    return null;
  }

  return {
    kind: "anyOf",
    options: [
      { kind: "ranked", group: "powers", targetKey: "moc", value },
      { kind: "ranked", group: "powers", targetKey: "wiez", value },
    ],
  };
}

/**
 * Reads a count requirement out of the library's phrasings (Wave 8.1):
 *   "ilość postaw 4"                 → count(stances) ≥ 4
 *   "dwa widmowe manewry"            → count(maneuvers, tag: widmowy) ≥ 2
 *   "ilość okrzyków 2"               → count(maneuvers, tag: okrzyki-bojowe) ≥ 2
 *   "ilość postaw i manewrów fizycznych 3" → groups: [stances, maneuvers]
 *
 * Returns `null` unless a group word AND a number are both present — anything
 * vaguer is left for a human.
 */
function suggestCount(normalized: string): CountRequirement | null
{
  const words = normalized.split(/[\s,]+/).filter(Boolean);

  const named = COUNT_GROUP_WORDS
    .filter(([stem]) => words.some((word) => word.startsWith(stem)))
    .map(([, group]) => group);

  const tagged = COUNT_TAG_WORDS.find(([word]) => words.some((entry) => entry.startsWith(word)));

  // "Ilość okrzyków 2" names no group at all — the tag implies one, since
  // `okrzyki-bojowe` only ever appears on maneuvers. But that inference needs an
  // explicit counting cue: without it, ANY text carrying a tag word and a number
  // would become a count, and "Cios Tarczą 2" — a maneuver NAME — was read as
  // "two shield maneuvers".
  const hasCountCue = words.some((word) => COUNT_CUE_WORDS.some((cue) => word.startsWith(cue)));
  const groups = named.length > 0 ? named : hasCountCue && tagged ? [tagged[2]] : [];

  if (groups.length === 0)
  {
    return null;
  }

  // "na randze 3" / "na poziomie co najmniej 2" is a floor on each counted
  // entity, NOT the count. Pulled out first so the digit it owns cannot be
  // mistaken for the quantity — that is how "pięć atutów ofensywnych na poziomie
  // co najmniej 2" came out as "co najmniej 2 atuty" instead of five.
  const gradeMatch = normalized.match(GRADE_QUALIFIER);
  const minGrade = gradeMatch ? Number.parseInt(gradeMatch[1]!, 10) : undefined;
  const withoutGrade = gradeMatch ? normalized.replace(GRADE_QUALIFIER, " ") : normalized;

  const spelled = words.map((word) => NUMBER_WORDS[word]).find((entry) => entry !== undefined);
  const digits = extractRequirementValue(withoutGrade);

  // A spelled-out number always names the quantity ("pięć atutów …"); a bare
  // digit does too, but only once the rank qualifier has been removed.
  // "Postawa na randze 3" has no quantity at all — one such entity is enough.
  const value = spelled ?? digits ?? (minGrade !== undefined ? 1 : undefined);

  if (value === undefined)
  {
    return null;
  }

  // Deduplicate while keeping the order groups were recognised in.
  return {
    kind: "count",
    groups: Array.from(new Set(groups)),
    ...(tagged ? { tag: tagged[1] } : {}),
    ...(minGrade === undefined ? {} : { minGrade }),
    value,
  };
}

/**
 * Additive requirement written with a plus (Wave 7.4's data form):
 * "Umysł+Zręczność 3" → sum of both statistics ≥ 3. Every addend must resolve
 * to a statistic, otherwise the text is left alone.
 */
function suggestSum(normalized: string): SumRequirement | null
{
  if (!normalized.includes("+"))
  {
    return null;
  }

  const value = extractRequirementValue(normalized);
  if (value === undefined)
  {
    return null;
  }

  const parts = normalized.split("+").map((part) => nameCandidate(part).trim()).filter(Boolean);
  if (parts.length < 2)
  {
    return null;
  }

  const targets: StatisticTarget[] = [];

  for (const part of parts)
  {
    const matches = matchStatisticExact(part, value);
    if (matches.length !== 1)
    {
      return null;
    }

    targets.push({ group: matches[0]!.group as StatisticTarget["group"], targetKey: matches[0]!.targetKey });
  }

  return { kind: "sum", targets, value };
}

/**
 * Equipment phrasings (Wave 8.2). Two shapes in the data:
 *  - tiered: "lekka zbroja", "co najmniej średnia tarcza" → category + tier;
 *  - plain:  "miecz", "topór", "broń krótkodystansowa"    → category, tier 1.
 */
/**
 * Tier words are per category, because the scales genuinely differ: armour runs
 * lekka(1) → średnia(2) → ciężka(3), while shields run
 * puklerz(1) → mała(2) → średnia(3) → duża(4) → pawęż(5). Sharing one list made
 * "co najmniej średnia tarcza" come out as tier 2 instead of 3.
 */
const TIER_WORDS_BY_CATEGORY: Readonly<Record<string, readonly [word: string, tier: number][]>> = {
  armor: [["lekk", 1], ["średni", 2], ["sredni", 2], ["ciężk", 3], ["ciezk", 3]],
  shield: [["puklerz", 1], ["mał", 2], ["mal", 2], ["średni", 3], ["sredni", 3], ["duż", 4], ["duz", 4], ["paweż", 5], ["pawez", 5]],
};

/** Category words → `EQUIPMENT_TARGETS` key. Longest phrases first. */
const EQUIPMENT_CATEGORY_WORDS: readonly [phrase: string, key: string][] = [
  ["zbroja", "armor"], ["zbroi", "armor"], ["zbroję", "armor"], ["pancerz", "armor"],
  ["tarcza", "shield"], ["tarczy", "shield"], ["tarczę", "shield"], ["puklerz", "shield"],
  ["broń dwuręczna", "weapon.dwuręczna"], ["broń dwureczna", "weapon.dwuręczna"],
  ["broń jednoręczna", "weapon.jednoręczna"],
  ["broń krótkodystansowa", "weapon.krótkie"], ["broń krótka", "weapon.krótkie"],
  ["broń dystansowa", "weapon.dystansowe"],
  ["broń obuchowa", "weapon.obuchowe"],
  ["broń drzewcowa", "weapon.drzewcowe"],
  ["broń sieczna", "weapon.sieczne"],
  ["miecz", "weapon.miecze"], ["topór", "weapon.topory"], ["topor", "weapon.topory"],
  ["puginał", "weapon.puginały"], ["łuk", "weapon.łuki"], ["kusza", "weapon.kusze"],
];

function suggestEquipment(normalized: string): RankedRequirement[]
{
  const category = EQUIPMENT_CATEGORY_WORDS.find(([phrase]) => normalized.includes(phrase));
  if (!category)
  {
    return [];
  }

  const key = category[1];
  const target = EQUIPMENT_TARGETS.find((entry) => entry.key === key);
  const tiered = Boolean(target?.tiers || target?.blockTiers);

  // Only tiered categories carry a threshold; a plain "miecz" is simply owned.
  const tier = tiered
    ? (TIER_WORDS_BY_CATEGORY[key] ?? []).find(([word]) => normalized.includes(word))?.[1] ?? 1
    : 1;

  return [{ kind: "ranked", group: "equipment", targetKey: key, value: tier }];
}

/** The first tier that produced anything, or an empty list. */
function winningTier(normalized: string, candidate: string, value: number, entityNames: EntityNameOptions): RankedRequirement[]
{
  const tiers = [
    matchEntitiesExact(candidate, entityNames, value),
    matchDerivedPhrase(candidate, value),
    matchStatisticExact(candidate, value),
    matchPowerType(candidate, value),
    suggestEquipment(normalized),
    matchStatisticByWord(candidate, value),
    matchAbbreviation(normalized, value),
  ];

  return tiers.find((tier) => tier.length > 0) ?? [];
}

/**
 * Ways the library spells out an alternative: a slash ("Moc/Więź 6",
 * 96 occurrences) or the word itself ("Większy Fechtunek 5 lub Większy Fortel 5",
 * 25 occurrences across the „lub" forms).
 */
const ALTERNATIVE_SEPARATOR = /\s*\/\s*|\s+(?:lub|albo|bądź)\s+/;

/**
 * Reads a written-out alternative. Each side is resolved on its own; a side
 * without its own number inherits the one from the whole text, which is what
 * makes "Moc/Więź 6" mean "Moc 6 or Więź 6".
 *
 * Returns `null` unless EVERY side resolves unambiguously — a half-understood
 * alternative is worse than leaving the text alone. That guard is what keeps
 * "Lekka lub średnia zbroja" and "Większy Fechtunek 4 lub co najmniej średnia
 * tarcza" out: their second half names equipment, which is not a requirement
 * target, so the whole text stays free text for a human to handle.
 */
function suggestAlternative(normalized: string, entityNames: EntityNameOptions): RankedRequirement | AnyOfRequirement | null
{
  const parts = normalized.split(ALTERNATIVE_SEPARATOR).map((part) => part.trim()).filter((part) => part.length > 0);
  if (parts.length < 2)
  {
    return null;
  }

  const sharedValue = extractRequirementValue(normalized) ?? 1;
  const options: RankedRequirement[] = [];

  for (const part of parts)
  {
    const value = extractRequirementValue(part) ?? sharedValue;
    const candidate = nameCandidate(part);
    if (candidate.length === 0)
    {
      return null;
    }

    const matches = winningTier(part, REQUIREMENT_SYNONYMS[candidate] ?? candidate, value, entityNames);
    if (matches.length !== 1)
    {
      return null;
    }

    options.push(matches[0]!);
  }

  // "Siła 3/Siła 3" is not an alternative, it is the same requirement written
  // twice — collapse it instead of building a one-sided `anyOf`.
  const distinct = new Set(options.map((option) => `${option.group}:${option.targetKey}:${option.value}`));
  return distinct.size < 2 ? options[0]! : { kind: "anyOf", options };
}

/**
 * Full result: the confident suggestion plus, when the text is claimed by more
 * than one group, the list a human picks from. Ambiguity is only ever reported
 * *within* one tier — a more specific match always beats a looser one rather
 * than competing with it.
 */
export function suggestRequirementMappings(text: string, entityNames: EntityNameOptions = {}): MappingSuggestion
{
  const empty: MappingSuggestion = { suggestion: null, candidates: [], ambiguous: false };

  const normalized = normalizeRequirementText(text);
  if (normalized.length === 0)
  {
    return empty;
  }

  // A negated or excluding text must never produce a positive requirement.
  if (NEGATION_PATTERNS.some((pattern) => pattern.test(normalized)))
  {
    return empty;
  }

  const value = extractRequirementValue(normalized) ?? 1;
  const rawCandidate = nameCandidate(normalized);
  if (rawCandidate.length === 0)
  {
    return empty;
  }

  // Synonyms are resolved up front so every tier sees the canonical wording.
  const candidate = REQUIREMENT_SYNONYMS[rawCandidate] ?? rawCandidate;

  // A spelled-out alternative wins over everything: "Moc/Więź 6" and
  // "Większy Fechtunek 5 lub Większy Fortel 5" must not be squeezed into a
  // single target.
  if (ALTERNATIVE_SEPARATOR.test(normalized))
  {
    const alternative = suggestAlternative(normalized, entityNames);

    // Crucially, do NOT fall through when only part of a compound resolves.
    // "Większy Fechtunek 4 lub co najmniej średnia tarcza" would otherwise
    // match the word "fechtunek" and be silently recorded as
    // `attributes/fencing ≥ 4` — dropping the shield half of the requirement
    // and asserting something the text never said.
    if (!alternative)
    {
      return empty;
    }

    // `candidates` only ever lists ranked readings; an alternative built here
    // always resolves each side to one, so nothing is lost by narrowing.
    return alternative.kind === "anyOf"
      ? { suggestion: alternative, candidates: rankedEntriesOf(alternative), ambiguous: false }
      : { suggestion: alternative, candidates: [alternative], ambiguous: false };
  }

  const anyPower = suggestAnyPower(candidate, value);
  if (anyPower)
  {
    return { suggestion: anyPower, candidates: rankedEntriesOf(anyPower), ambiguous: false };
  }

  const winning = winningTier(normalized, candidate, value, entityNames);

  if (winning.length === 0)
  {
    // Only once nothing more specific matched. Order matters: „siła zaklęcia 6"
    // contains the stem „zaklę", so a count check placed earlier would read it
    // as "six spells" instead of the derived value it actually is.
    const sum = suggestSum(normalized);
    if (sum)
    {
      return { suggestion: sum, candidates: [], ambiguous: false };
    }

    const count = suggestCount(normalized);
    if (count)
    {
      return { suggestion: count, candidates: [], ambiguous: false };
    }

    return empty;
  }

  return winning.length === 1
    ? { suggestion: winning[0]!, candidates: winning, ambiguous: false }
    : { suggestion: null, candidates: winning, ambiguous: true };
}

/**
 * Returns a suggested `ranked` requirement, or `null` when nothing confident is
 * found (the entry should stay `rankless`). A missing number defaults to rank 1
 * ("owns it at all"). Thin wrapper over `suggestRequirementMappings` so existing
 * callers keep their signature.
 */
export function suggestRequirementMapping(text: string, entityNames: EntityNameOptions = {}): RankedRequirement | AnyOfRequirement | CountRequirement | SumRequirement | null
{
  return suggestRequirementMappings(text, entityNames).suggestion;
}
