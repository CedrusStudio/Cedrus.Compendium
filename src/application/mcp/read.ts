import 'server-only';
import { z } from 'zod';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import { checkRequirement } from '@/domain/requirements/checkRequirement';
import { formatRequirement } from '@/domain/requirements/formatRequirement';
import prisma from '@/lib/prisma';
import { characterVisibilityWhere } from '@/persistence/characterVisibility';
import { getCharactersVisibleToApiKeyByIds } from '@/persistence/characters/charactersRepository';
import { toAiCharacterGenerationReference } from '@/domain/ai-character-generation/CharacterGenerationContextSource';
import { loadAllSections } from '@/persistence/rulebook/rulebookLoader';
import { readCatalogPage } from '@/persistence/ai-character-generation/aiCharacterCatalogRepository';
import { searchInput, entryInput } from '@/domain/mcp/readContracts';
import { unavailable, CompendiumToolError } from './errors';

const catalogPaths = {
  race: 'races', perk: 'perks', maneuver: 'maneuvers', stance: 'stances', state: 'states', spell: 'spells',
  powerSpecification: 'powers', weapon: 'equipment/weapons', armor: 'equipment/armors',
  shield: 'equipment/shields', inventoryItem: 'equipment/inventory', mount: 'equipment/mounts',
} as const;

function rulebook() {
  try { return loadAllSections(); }
  catch { throw new CompendiumToolError(503, 'Rulebook unavailable. Run npm run sync-rulebook in Compendium.'); }
}

export async function searchEntries(input: z.infer<typeof searchInput>, apiKey: string) {
  const { kind, query, tag, limit, offset } = input;
  if (kind === 'character') {
    const hits = await prisma.character.findMany({
      where: { AND: [characterVisibilityWhere(apiKey), {
        ...(tag && { tags: { has: tag } }),
        ...(query && { OR: [{ name: { contains: query, mode: 'insensitive' } }, { shortName: { contains: query, mode: 'insensitive' } }] }),
      }] },
      orderBy: [{ name: 'asc' }, { id: 'asc' }], take: limit, skip: offset,
      select: { id: true, name: true, shortName: true, tags: true },
    });
    return hits.map(hit => ({ ...hit, kind, href: '/characters/' + encodeURIComponent(hit.id) }));
  }
  if (kind === 'rulebook') {
    const needle = query.toLocaleLowerCase();
    return rulebook().filter(section =>
      (!tag || section.tags?.includes(tag)) &&
      [section.title, section.description, ...section.tags ?? [], JSON.stringify([section.content, section.subsections])]
        .some(text => text?.toLocaleLowerCase().includes(needle)),
    ).slice(offset, offset + limit).map(section => {
      const id = section.category + '/' + section.slug;
      return { id, kind, name: section.title, category: section.category, slug: section.slug, href: '/rulebook/' + id };
    });
  }
  const hits = await readCatalogPage(kind, { query, tag, limit, offset });
  return hits.map(({ id, name, grade, tags }) => ({ kind, id, name, grade, tags, href: '/compendium/' + catalogPaths[kind] }));
}

export async function readEntry(input: z.infer<typeof entryInput>, apiKey: string) {
  const { id, kind } = input;
  if (input.forCharacterId && (kind === 'character' || kind === 'rulebook')) throw new CompendiumToolError(400, 'Select a catalog entry to evaluate requirements.');
  if (kind === 'rulebook') {
    const section = rulebook().find(entry => entry.category + '/' + entry.slug === id);
    if (!section) return unavailable();
    return { kind, ...section, href: '/rulebook/' + id };
  }
  if (kind !== 'character') {
    const [entry] = await readCatalogPage(kind, { id, limit: 1, offset: 0 });
    if (!entry) return unavailable();
    const result = { ...entry, href: '/compendium/' + catalogPaths[kind] };
    if (!input.forCharacterId) return result;
    const [character] = await getCharactersVisibleToApiKeyByIds([input.forCharacterId], apiKey);
    if (!character) return unavailable();
    const requirements = readStructuredRequirements({ structuredRequirements:
      'structuredRequirements' in entry.details ? entry.details.structuredRequirements : null });
    return { ...result, characterId: character.id, requirementChecks: requirements.map(requirement => ({
      text: formatRequirement(requirement), met: checkRequirement(requirement, character),
    })) };
  }
  const [character] = await getCharactersVisibleToApiKeyByIds([id], apiKey);
  if (!character) return unavailable();
  const c = toAiCharacterGenerationReference(character);
  const groups = {
    overview: { shortName: c.shortName, description: c.description, tags: c.tags, race: c.race && { id: c.race.id, name: c.race.name } },
    statistics: { characteristics: c.characteristics, attributes: c.attributes },
    talents: { talents: c.talents, perks: c.perks },
    combat: { health: c.health, stances: c.stances, states: c.states, maneuvers: c.maneuvers, powers: c.powers,
      offenses: c.offenses, defenses: c.defenses, defaultOffenseId: c.defaultOffenseId, defaultDefenseId: c.defaultDefenseId },
    equipment: c.equipment,
    buffs: { profiles: c.buffProfiles, activeIds: c.activeBuffProfileIds, stance: c.stanceModifierProfiles,
      state: c.stateModifierProfiles, other: c.otherModifierProfiles },
  };
  const sections = input.sections ?? ['overview'];
  return { id, name: c.name, kind, href: '/characters/' + encodeURIComponent(id),
    ...Object.fromEntries(sections.map(section => [section, groups[section]])) };
}
