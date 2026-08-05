import type {
  AiCharacterGenerationReference,
} from '@/domain/ai-character-generation/CharacterGenerationContextSource';
import type {
  CharacterGenerationCatalogEntry,
  CharacterGenerationContext,
} from '@/domain/ai-character-generation/CharacterGenerationProvider';
import type {
  AiCharacterGenerationRequest,
} from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import {
  selectCatalogEntries,
  type CatalogSelectionQuota,
} from '@/domain/ai-character-generation/selectCatalogEntries';
import { selectBalanceProfiles, type BalanceProfile } from '@/domain/ai-character-generation/buildBalanceProfiles';
import { selectPowerScale, selectPowerTier } from '@/domain/ai-character-generation/powerTiers';
import type { Requirement } from '@/domain/requirements/Requirement';

/**
 * The ceiling every provider adapter enforces before it calls out. It is our
 * own budget, not a model limit: at 60 000 the catalog was squeezed to a few
 * dozen entries out of two and a half thousand, so the model chose from
 * whatever happened to fit rather than from the compendium.
 */
export const MAX_CHARACTER_GENERATION_CONTEXT_CHARS = 120_000;

/** Leaves room for the JSON scaffolding the measurement below cannot see. */
const CONTEXT_SAFETY_MARGIN_CHARS = 4_000;

/**
 * Below this there is no point pretending the catalog is usable: a handful of
 * records would only mislead the model into thinking the compendium is nearly
 * empty, which is worse than telling it the catalog is unavailable.
 */
const MIN_USABLE_CATALOG_BUDGET_CHARS = 4_000;

/**
 * Races are guaranteed in full so the model can always place the character in
 * the world instead of leaving `raceId` empty. Everything else leans on
 * relevance, with a floor so a vague description still gets something to pick
 * from.
 */
const catalogQuotas: Readonly<Record<string, CatalogSelectionQuota>> = {
  race: { min: 40, max: 100 },
  perk: { min: 10, max: 200 },
  maneuver: { min: 10, max: 200 },
  stance: { min: 4, max: 120 },
  state: { min: 4, max: 30 },
  spell: { min: 0, max: 120 },
  powerSpecification: { min: 0, max: 20 },
  weapon: { min: 6, max: 60 },
  armor: { min: 4, max: 30 },
  shield: { min: 3, max: 15 },
  inventoryItem: { min: 4, max: 40 },
  mount: { min: 0, max: 10 },
};

const defaultCatalogQuota: CatalogSelectionQuota = { min: 0, max: 20 };

/**
 * Everything the reference characters are built from. These entries are the
 * strongest relevance signal available — the user chose those characters as the
 * pattern to follow — and they are exactly what plain keyword scoring misses,
 * because a stance called „Postawa Defensywna" shares no word with a
 * description about swords and feints.
 */
function collectReferenceEntryIds(references: readonly AiCharacterGenerationReference[]): Set<string>
{
  const ids = new Set<string>();

  for (const reference of references) {
    if (reference.race) ids.add(reference.race.id);

    for (const entry of [...reference.stances, ...reference.states, ...reference.maneuvers, ...reference.perks]) {
      ids.add(entry.id);
    }
    for (const power of reference.powers) {
      ids.add(power.powerSpecificationId);
      for (const spell of power.spells) ids.add(spell.id);
    }
    for (const items of Object.values(reference.equipment)) {
      for (const item of items) ids.add(item.id);
    }
  }

  return ids;
}

export type CharacterGenerationContextInput = {
  catalogEntries?: readonly CharacterGenerationCatalogEntry[];
  rulebookFragments?: readonly string[];
  balanceProfiles?: readonly BalanceProfile[];
  /**
   * Structured requirements of the catalog, used to leave out entries the
   * selection cannot support. They never travel to the model — it reads the
   * prose sentence on each entry — so this costs nothing in the prompt.
   */
  catalogRequirements?: ReadonlyMap<string, readonly Requirement[]>;
};

export function buildCharacterGenerationContext(
  request: AiCharacterGenerationRequest,
  references: AiCharacterGenerationReference[],
  input: CharacterGenerationContextInput = {},
): CharacterGenerationContext
{
  const query = [request.description, request.constraints.notes ?? ''].join(' ');
  const balanceProfiles = selectBalanceProfiles(input.balanceProfiles ?? [], query);
  // Tags are not known before the model answers, so the family is read from the
  // description; the scale itself travels so the model can see which ladder it
  // is being measured against.
  const powerScale = selectPowerScale(query);
  const powerTier = selectPowerTier(query);
  const rulebookFragments = [...(input.rulebookFragments ?? [])];
  const rulebookContext: CharacterGenerationContext['rulebookContext'] = rulebookFragments.length > 0
    ? { availability: 'configured', fragments: rulebookFragments }
    : { availability: 'not-configured', fragments: [] };

  const catalogEntries = input.catalogEntries ?? [];
  if (catalogEntries.length === 0) {
    return {
      request,
      references,
      allowedCatalog: { availability: 'not-configured', entries: [] },
      rulebookContext,
      balanceProfiles,
      powerScale,
    ...(powerTier ? { powerTier } : {}),
    };
  }

  // References and rulebook fragments are already fixed at this point, so the
  // catalog gets whatever they left behind rather than a guessed constant.
  const committed = JSON.stringify({
    request,
    references,
    allowedCatalog: { availability: 'configured', entries: [] },
    rulebookContext,
    balanceProfiles,
    powerScale,
    ...(powerTier ? { powerTier } : {}),
  }).length;
  const budgetChars = MAX_CHARACTER_GENERATION_CONTEXT_CHARS - committed - CONTEXT_SAFETY_MARGIN_CHARS;

  if (budgetChars < MIN_USABLE_CATALOG_BUDGET_CHARS) {
    return {
      request,
      references,
      allowedCatalog: { availability: 'not-configured', entries: [] },
      rulebookContext,
      balanceProfiles,
      powerScale,
    ...(powerTier ? { powerTier } : {}),
    };
  }

  const entries = selectCatalogEntries({
    entries: catalogEntries,
    query,
    quotas: catalogQuotas,
    defaultQuota: defaultCatalogQuota,
    budgetChars,
    pinnedIds: collectReferenceEntryIds(references),
    requirementsById: input.catalogRequirements,
  });

  return {
    request,
    references,
    allowedCatalog: { availability: 'configured', entries },
    rulebookContext,
    balanceProfiles,
    powerScale,
    ...(powerTier ? { powerTier } : {}),
  };
}
