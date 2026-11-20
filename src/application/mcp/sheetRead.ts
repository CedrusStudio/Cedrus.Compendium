import 'server-only';
import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import type { cardSection } from '@/domain/mcp/readContracts';
import { gearGroups } from '@/domain/mcp/sheetContracts';
import { includeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';
import { isCharacterVisible } from '@/persistence/characterVisibility';
import { toCharacter, type CharacterWithRelations } from '@/persistence/mappings/characterMapping';
import { applyActiveBuffProfile } from '@/domain/characters/buffs/applyBuffProfile';
import { activeFields, profileGroups } from '@/domain/mcp/sheetContracts';
import { unavailable } from './errors';

export async function loadSheet(tx: Prisma.TransactionClient, id: string, key: string) {
  const row = await tx.character.findUnique({ where: { id }, include: includeAllRelations });
  if (!row || !isCharacterVisible(row.apiKeys, key)) return unavailable();
  return row;
}

export function verificationSections(differences: Prisma.JsonValue): z.infer<typeof cardSection>[] {
  const sections = new Set<z.infer<typeof cardSection>>();
  for (const item of Array.isArray(differences) ? differences : []) {
    if (!item || typeof item !== 'object' || !('field' in item) || typeof item.field !== 'string') continue;
    const [group] = item.field.split('/');
    if ((gearGroups as readonly string[]).includes(group)) sections.add('equipment');
    else if (group === 'talents' || group === 'perks') sections.add('talents');
    else if (group.includes('Profile')) {
      sections.add('buffs');
      sections.add('combat');
      sections.add('statistics');
    } else if (group.includes('.')) sections.add('statistics');
    else if (['name', 'shortName', 'description', 'tags', 'raceId'].includes(group)) sections.add('overview');
    else sections.add('combat');
  }
  return sections.size ? [...sections] : ['overview'];
}

export function fullSheet(row: CharacterWithRelations, sections?: string[]) {
  const c = toCharacter(row),
    effective = applyActiveBuffProfile(c);
  const stats = (v: typeof c) => ({ characteristics: v.characteristics, attributes: v.attributes });
  const combat = (v: typeof c) => ({ health: v.health, offenses: v.offenses, defenses: v.defenses });
  const groups = {
    overview: {
      name: c.name,
      shortName: c.shortName,
      description: c.description,
      tags: c.tags,
      race: c.race && { ...c.race, href: '/compendium/races' },
      raceId: row.raceId,
    },
    statistics: { base: stats(c), effective: stats(effective) },
    talents: { talents: c.talents, perks: c.perks.map((perk) => ({ ...perk, href: '/compendium/perks' })) },
    combat: {
      base: combat(c),
      effective: combat(effective),
      defaultOffenseId: c.defaultOffenseId,
      defaultDefenseId: c.defaultDefenseId,
      maneuvers: c.maneuvers.map((maneuver) => ({ ...maneuver, href: '/compendium/maneuvers' })),
      stances: c.stances.map((stance) => ({ ...stance, href: '/compendium/stances' })),
      states: c.states.map((state) => ({ ...state, href: '/compendium/states' })),
      powers: c.powers.map((power, i) => ({
        ...power,
        spellIds: row.powers[i].spellsIds,
        spells: power.spells.map((spell) => ({ ...spell, href: '/compendium/spells' })),
        specificationHref: '/compendium/powers',
      })),
      powerSpecifications: row.powerSpecifications.map(({ id, name, description, tags, offenses }) => ({
        id,
        name,
        description,
        tags,
        offenses,
        href: '/compendium/powers',
      })),
    },
    equipment: Object.fromEntries(
      Object.entries(c.equipment).map(([group, items]) => [
        group,
        items.map((item: { id: string }) => ({ ...item, href: '/compendium/equipment/' + group })),
      ]),
    ),
    buffs: Object.fromEntries(
      profileGroups.map((group) => [group, { profiles: c[group], activeIds: c[activeFields[group]] }]),
    ),
  };
  return {
    kind: 'character',
    id: c.id,
    name: c.name,
    href: '/characters/' + encodeURIComponent(c.id),
    ...Object.fromEntries(Object.entries(groups).filter(([group]) => !sections || sections.includes(group))),
  };
}
