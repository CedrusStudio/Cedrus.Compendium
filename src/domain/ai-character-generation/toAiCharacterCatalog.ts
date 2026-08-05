import { formatRequirement } from '@/domain/requirements/formatRequirement';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';

/**
 * Kinds are the vocabulary the model uses to talk about the compendium, and
 * they map one-to-one onto the reference checks in
 * `validateAiCharacterProposalForAcceptance`.
 */
export const AI_CATALOG_KINDS = [
  'race',
  'perk',
  'maneuver',
  'stance',
  'state',
  'spell',
  'powerSpecification',
  'weapon',
  'armor',
  'shield',
  'inventoryItem',
  'mount',
] as const;

export type AiCatalogKind = (typeof AI_CATALOG_KINDS)[number];

/**
 * A compendium record as the draft reviewer's picker sees it: the display
 * fields the model also gets, plus the record in the shape a character stores.
 *
 * The two are genuinely different and both are needed. `requirements` is prose
 * for a human to read before picking; `entry` is what gets linked into the
 * proposal, structured requirements and all, so the requirement report
 * recomputes against the record that was actually chosen.
 */
export type AiCatalogSearchResult = CharacterGenerationCatalogEntry & {
  entry: Record<string, unknown>;
};

/** Kinds whose records carry a rank, a price and requirements. */
const REQUIRABLE_KINDS = new Set<AiCatalogKind>(['perk', 'maneuver', 'stance', 'state', 'spell']);

/**
 * Descriptions are the bulk of a compendium record and the model only needs
 * enough to tell two entries apart, so they are clipped rather than dropped —
 * the full text stays one accepted draft away in the application itself.
 */
const MAX_CATALOG_DESCRIPTION_CHARS = 300;

export type RawCatalogRecord = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  grade?: unknown;
  price?: unknown;
  tags?: unknown;
  structuredRequirements?: unknown;
  replaces?: unknown;
};

/** Raw records per kind, as read from Prisma or from a backup dump. */
export type RawCatalog = Partial<Record<AiCatalogKind, readonly RawCatalogRecord[]>>;

function clip(description: unknown): string | undefined
{
  if (typeof description !== 'string') return undefined;

  const trimmed = description.trim();
  if (trimmed.length === 0) return undefined;

  return trimmed.length <= MAX_CATALOG_DESCRIPTION_CHARS
    ? trimmed
    : `${trimmed.slice(0, MAX_CATALOG_DESCRIPTION_CHARS - 1)}…`;
}

function toTags(tags: unknown): string[] | undefined
{
  if (!Array.isArray(tags)) return undefined;

  const values = tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  return values.length > 0 ? values : undefined;
}

function toRequirementTexts(structuredRequirements: unknown): string[] | undefined
{
  const requirements = readStructuredRequirements(
    { structuredRequirements } as Parameters<typeof readStructuredRequirements>[0],
  );
  if (requirements.length === 0) return undefined;

  return requirements.map(formatRequirement);
}

function toNumber(value: unknown): number | undefined
{
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Equipment is chosen for its numbers, so the numbers travel. `grade` here is a
 * rung on the dice ladder rather than a die size — a sword at grade 5 rolls
 * k10 — which is also why the model cannot be left to guess it.
 */
const STATISTIC_FIELDS: Partial<Record<AiCatalogKind, readonly string[]>> = {
  weapon: ['style', 'range', 'offense', 'damageBonus'],
  armor: ['immunity', 'protection', 'resistance', 'dexterityRestriction', 'reflexRestriction',
    'initiativeRestriction', 'attributePenalty', 'strengthRequirement'],
  shield: ['block', 'resistance', 'dexterityRestriction', 'reflexRestriction',
    'initiativeRestriction', 'attributePenalty', 'strengthRequirement'],
  mount: ['paceSpeed', 'gallopSpeed', 'canterSpeed', 'horsemanshipBonus'],
  race: ['strengthModifier', 'dexterityModifier', 'constitutionModifier',
    'mindModifier', 'charismaModifier', 'spellbornModifier'],
};

function pickStatistics(kind: AiCatalogKind, record: RawCatalogRecord): Record<string, unknown> | undefined
{
  const fields = STATISTIC_FIELDS[kind];
  if (!fields) return undefined;

  const source = record as Record<string, unknown>;
  const picked = Object.fromEntries(
    fields
      .filter(field => source[field] !== undefined && source[field] !== null)
      .map(field => [field, source[field]]),
  );

  return Object.keys(picked).length > 0 ? picked : undefined;
}

/**
 * Maps compendium records into the shape the model sees. It is deliberately
 * defensive and free of any data access, so the same mapping serves the live
 * database and an offline backup dump — the two must never drift, or a draft
 * prepared offline would reference entries the server does not recognise.
 */
export function toAiCharacterCatalog(raw: RawCatalog): CharacterGenerationCatalogEntry[]
{
  const entries: CharacterGenerationCatalogEntry[] = [];

  for (const kind of AI_CATALOG_KINDS) {
    for (const record of raw[kind] ?? []) {
      if (typeof record.id !== 'string' || typeof record.name !== 'string') continue;

      const entry: CharacterGenerationCatalogEntry = {
        kind,
        id: record.id,
        name: record.name,
        description: clip(record.description),
        tags: toTags(record.tags),
      };

      const statistics = pickStatistics(kind, record);
      if (statistics) entry.statistics = statistics;

      if (REQUIRABLE_KINDS.has(kind)) {
        entry.grade = toNumber(record.grade);
        entry.price = toNumber(record.price);
        entry.requirements = toRequirementTexts(record.structuredRequirements);
        entry.replaces = toTags(record.replaces);
      }

      entries.push(entry);
    }
  }

  return entries;
}
