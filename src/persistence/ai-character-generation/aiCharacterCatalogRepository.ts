import 'server-only';
import { fromSpellCostPersistence } from '@/domain/characters/combat/SpellCost';
import type { AiCatalogKind } from '@/domain/ai-character-generation/catalogKinds';
import prisma from '@/lib/prisma';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import type { Requirement } from '@/domain/requirements/Requirement';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import { type AiCatalogSearchResult, toAiCharacterCatalog } from '@/domain/ai-character-generation/toAiCharacterCatalog';

export { AI_CATALOG_KINDS, type AiCatalogKind } from '@/domain/ai-character-generation/toAiCharacterCatalog';

const requirableSelect = {
  id: true,
  name: true,
  description: true,
  grade: true,
  price: true,
  tags: true,
  structuredRequirements: true,
  replaces: true,
} as const;

const plainSelect = { id: true, name: true, description: true, tags: true } as const;

/** Equipment is picked for its numbers, so the numbers have to be selected. */
const weaponSelect = { ...plainSelect, style: true, range: true, offense: true, damageBonus: true } as const;
const defenceItemSelect = {
  ...plainSelect,
  resistance: true, dexterityRestriction: true, reflexRestriction: true,
  initiativeRestriction: true, attributePenalty: true, strengthRequirement: true,
} as const;
const armorSelect = { ...defenceItemSelect, immunity: true, protection: true } as const;
const shieldSelect = { ...defenceItemSelect, block: true } as const;
const mountSelect = {
  ...plainSelect, paceSpeed: true, gallopSpeed: true, canterSpeed: true, horsemanshipBonus: true,
} as const;
const raceSelect = {
  ...plainSelect,
  strengthModifier: true, dexterityModifier: true, constitutionModifier: true,
  mindModifier: true, charismaModifier: true, spellbornModifier: true,
} as const;

/**
 * Reads the whole compendium in its model-facing shape. Narrowing to one
 * request happens in the domain (`selectCatalogEntries`) rather than here,
 * because relevance depends on the character description and the remaining
 * prompt budget, neither of which belongs in a query.
 */
/**
 * Structured requirements for every entry that has any, keyed by identifier.
 *
 * Deliberately separate from the catalog: the model reads requirements as the
 * prose sentence already on each entry, while the comparison engine needs the
 * structures. Sending both would pay for the same information twice out of a
 * prompt budget that is already the binding constraint.
 */
export async function loadAiCharacterRequirements(): Promise<Map<string, Requirement[]>>
{
  const select = { id: true, structuredRequirements: true } as const;
  const [perks, maneuvers, stances, states, spells] = await Promise.all([
    prisma.perk.findMany({ select }),
    prisma.maneuver.findMany({ select }),
    prisma.stance.findMany({ select }),
    prisma.state.findMany({ select }),
    prisma.spell.findMany({ select }),
  ]);

  const index = new Map<string, Requirement[]>();
  for (const record of [...perks, ...maneuvers, ...stances, ...states, ...spells]) {
    const requirements = readStructuredRequirements(
      { structuredRequirements: record.structuredRequirements } as Parameters<typeof readStructuredRequirements>[0],
    );
    if (requirements.length > 0) index.set(record.id, requirements);
  }

  return index;
}

/** Which Prisma model each catalog kind reads from. */
const KIND_MODELS: Record<string, string> = {
  race: 'race',
  perk: 'perk',
  maneuver: 'maneuver',
  stance: 'stance',
  state: 'state',
  spell: 'spell',
  powerSpecification: 'powerSpecification',
  weapon: 'weapon',
  armor: 'armor',
  shield: 'shield',
  inventoryItem: 'inventoryItem',
  mount: 'mount',
};

/**
 * Fields that belong to the compendium record but never to a character's copy
 * of it. `characterIds` is the back-reference of the many-to-many relation, and
 * the Combat Lab columns describe how the engine simulates the entry rather
 * than what the character holds.
 */
const NOT_PART_OF_A_CHARACTER = ['characterIds', 'characters', 'effects', 'simulatable', 'unsupportedReason'];


/**
 * One kind of compendium record, filtered by name, for the draft reviewer.
 *
 * Deliberately a query rather than a filter over `loadAiCharacterCatalog`: the
 * whole compendium is more than half a megabyte in its model-facing shape, and
 * shipping it to a browser so a reviewer can add one maneuver would be absurd.
 *
 * Ordering by name then rank is what makes it usable for the case it was built
 * for — searching „Większy Fortel" is how a reviewer finds the rank 4 record
 * that satisfies a requirement the rank 3 one does not.
 */
export async function searchAiCharacterCatalog(
  kind: string,
  query: string,
  limit = 40,
): Promise<AiCatalogSearchResult[]>
{
  const model = KIND_MODELS[kind];
  if (!model) return [];

  const trimmed = query.trim();

  // @ts-expect-error Prisma does not type dynamic model access precisely.
  const records: Record<string, unknown>[] = await prisma[model].findMany({
    where: trimmed.length > 0 ? { name: { contains: trimmed, mode: 'insensitive' } } : undefined,
    orderBy: [{ name: 'asc' }],
    take: limit,
  });

  const byId = new Map(records.map(record => [
    String(record.id),
    Object.fromEntries(Object.entries(record).filter(([field]) => !NOT_PART_OF_A_CHARACTER.includes(field))),
  ]));

  return toAiCharacterCatalog({ [kind]: records } as Parameters<typeof toAiCharacterCatalog>[0])
    .map(display => ({ ...display, entry: byId.get(display.id) ?? {} }))
    .sort((left, right) => left.name.localeCompare(right.name) || (left.grade ?? 0) - (right.grade ?? 0));
}

export async function readCatalogPage(
  kind: AiCatalogKind,
  input: { query?: string; tag?: string; id?: string; offset: number; limit: number },
) {
  const args = {
    where: {
      ...(input.id && { id: input.id }),
      ...(input.query && { name: { contains: input.query, mode: 'insensitive' as const } }),
      ...(input.tag && { tags: { has: input.tag } }),
    },
    orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }], skip: input.offset, take: input.limit,
  };
  const castable = { ...requirableSelect, castTime: true, cooldown: true } as const;
  const spell = { ...castable, costBase: true, costScalingMode: true, costScalingValue: true, costRounding: true } as const;
  // Each branch supplies the exact Prisma projection for its record kind.
  const reads = {
    race: () => prisma.race.findMany({ ...args, select: raceSelect }),
    stance: () => prisma.stance.findMany({ ...args, select: requirableSelect }),
    state: () => prisma.state.findMany({ ...args, select: requirableSelect }),
    maneuver: () => prisma.maneuver.findMany({ ...args, select: castable }),
    perk: () => prisma.perk.findMany({ ...args, select: requirableSelect }),
    spell: async () => (await prisma.spell.findMany({ ...args, select: spell }))
      .map(record => ({ ...record, cost: fromSpellCostPersistence(record) })),
    powerSpecification: () => prisma.powerSpecification.findMany({ ...args, select: { ...plainSelect, offenses: true } }),
    weapon: () => prisma.weapon.findMany({ ...args, select: weaponSelect }),
    armor: () => prisma.armor.findMany({ ...args, select: armorSelect }),
    shield: () => prisma.shield.findMany({ ...args, select: shieldSelect }),
    inventoryItem: () => prisma.inventoryItem.findMany({ ...args, select: plainSelect }),
    mount: () => prisma.mount.findMany({ ...args, select: mountSelect }),
  };
  const records = await reads[kind]();
  const entries = toAiCharacterCatalog({ [kind]: records });
  return entries.map((entry, index) => {
    const record = records[index];
    return { ...entry, description: record.description, details: record };
  });
}

export async function loadAiCharacterCatalog(): Promise<CharacterGenerationCatalogEntry[]>
{
  const [race, perk, maneuver, stance, state, spell, powerSpecification,
    weapon, armor, shield, inventoryItem, mount] = await Promise.all([
    prisma.race.findMany({ select: raceSelect }),
    prisma.perk.findMany({ select: requirableSelect }),
    prisma.maneuver.findMany({ select: requirableSelect }),
    prisma.stance.findMany({ select: requirableSelect }),
    prisma.state.findMany({ select: requirableSelect }),
    prisma.spell.findMany({ select: requirableSelect }),
    prisma.powerSpecification.findMany({ select: plainSelect }),
    prisma.weapon.findMany({ select: weaponSelect }),
    prisma.armor.findMany({ select: armorSelect }),
    prisma.shield.findMany({ select: shieldSelect }),
    prisma.inventoryItem.findMany({ select: plainSelect }),
    prisma.mount.findMany({ select: mountSelect }),
  ]);

  return toAiCharacterCatalog({
    race, perk, maneuver, stance, state, spell, powerSpecification,
    weapon, armor, shield, inventoryItem, mount,
  });
}
