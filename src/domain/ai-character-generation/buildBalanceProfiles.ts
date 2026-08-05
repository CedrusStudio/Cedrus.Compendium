import { SKILLS } from '@/domain/characters/statistics/skills';
import { tokenize } from '@/domain/ai-character-generation/selectCatalogEntries';

/**
 * What characters of a kind actually look like, in numbers.
 *
 * The model had no idea where „exceptional" sits on this scale. Told only that
 * a speciality must beat ordinary training, it produced a fortel of 3 against a
 * fencing of 6 and called that a wyjątkowy talent — 3 is the median for the
 * tag it chose itself.
 */
export type BalanceStatistic = {
  /** Polish label, matching how requirements and the sheet name it. */
  name: string;
  median: number;
  high: number;
  max: number;
};

export type BalanceProfile = {
  tag: string;
  characters: number;
  attributes: BalanceStatistic[];
  characteristics: BalanceStatistic[];
  /** Highest attribute a character of this kind reaches — the speciality. */
  speciality: { median: number; high: number; max: number };
  maneuvers: { median: number; high: number };
  perks: { median: number; high: number };
};

/** The shape this reads, kept minimal so any character source can supply it. */
export type BalanceSourceCharacter = {
  tags?: string[];
  characteristics?: Record<string, { value?: number } | undefined>;
  attributes?: Record<string, { value?: number } | undefined>;
  maneuversIds?: string[];
  perksIds?: string[];
};

/**
 * A tag needs enough characters behind it before its percentiles mean
 * anything; below this the profile would describe two records and a rounding
 * error.
 */
const MIN_CHARACTERS_PER_TAG = 8;

/** How many tag profiles travel with one request. */
const MAX_PROFILES = 3;

function quantile(values: readonly number[], fraction: number): number
{
  if (values.length === 0) return 0;

  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function summarise(values: readonly number[]): { median: number; high: number; max: number }
{
  return {
    median: quantile(values, 0.5),
    high: quantile(values, 0.9),
    max: values.length === 0 ? 0 : Math.max(...values),
  };
}

function statisticValues(
  characters: readonly BalanceSourceCharacter[],
  group: 'attributes' | 'characteristics',
  key: string,
): number[]
{
  return characters.map(character => character[group]?.[key]?.value ?? 0);
}

function toProfile(tag: string, characters: readonly BalanceSourceCharacter[]): BalanceProfile
{
  const describe = (group: 'attributes' | 'characteristics') => SKILLS
    .filter(([skillGroup]) => skillGroup === group)
    .map(([, key, polish]) => {
      const { median, high, max } = summarise(statisticValues(characters, group, key));
      return { name: polish, median, high, max };
    });

  const attributeKeys = SKILLS.filter(([group]) => group === 'attributes').map(([, key]) => key);
  const specialities = characters.map(character =>
    Math.max(...attributeKeys.map(key => character.attributes?.[key]?.value ?? 0)));

  const maneuvers = characters.map(character => character.maneuversIds?.length ?? 0);
  const perks = characters.map(character => character.perksIds?.length ?? 0);

  return {
    tag,
    characters: characters.length,
    attributes: describe('attributes'),
    characteristics: describe('characteristics'),
    speciality: summarise(specialities),
    maneuvers: { median: quantile(maneuvers, 0.5), high: quantile(maneuvers, 0.9) },
    perks: { median: quantile(perks, 0.5), high: quantile(perks, 0.9) },
  };
}

/**
 * One profile per tag that has enough characters to be worth measuring.
 *
 * Tags matter more than a single global profile: the collection holds monsters
 * reaching an attribute of 16, while a „wojak" peaks around 8. A model given
 * the global scale would build every soldier like a dragon.
 */
export function buildBalanceProfiles(characters: readonly BalanceSourceCharacter[]): BalanceProfile[]
{
  const byTag = new Map<string, BalanceSourceCharacter[]>();

  for (const character of characters) {
    for (const tag of character.tags ?? []) {
      const bucket = byTag.get(tag);
      if (bucket) bucket.push(character);
      else byTag.set(tag, [character]);
    }
  }

  return [...byTag.entries()]
    .filter(([, bucket]) => bucket.length >= MIN_CHARACTERS_PER_TAG)
    .map(([tag, bucket]) => toProfile(tag, bucket));
}

/**
 * The profiles worth sending for one description, most populous first — a tag
 * backed by fifty characters describes the archetype better than one backed by
 * nine.
 */
export function selectBalanceProfiles(
  profiles: readonly BalanceProfile[],
  query: string,
): BalanceProfile[]
{
  const queryTokens = tokenize(query);

  return profiles
    .filter(profile => {
      const tagTokens = tokenize(profile.tag);
      return tagTokens.some(tagToken => queryTokens.some(queryToken => queryToken.startsWith(tagToken.slice(0, 4))));
    })
    .sort((left, right) => right.characters - left.characters)
    .slice(0, MAX_PROFILES);
}
