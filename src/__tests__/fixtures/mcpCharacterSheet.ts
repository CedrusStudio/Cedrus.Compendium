import { CreateEmptyCharacter } from '@/domain/characters/Character';
import type { CharacterWithRelations } from '@/persistence/mappings/characterMapping';

export function sheetFixture(key = 'local-fixture-key'): CharacterWithRelations {
  const character = CreateEmptyCharacter({
    name: 'Guard',
    shortName: 'Guard',
    description: 'Old description',
    tags: ['guard'],
  });
  return {
    ...character,
    id: 'guard',
    race: null,
    raceId: null,
    apiKeys: [key],
    ...character.equipment,
    weaponsIds: character.equipment.weapons.map((w) => w.id),
    armorsIds: character.equipment.armors.map((a) => a.id),
    shieldsIds: character.equipment.shields.map((s) => s.id),
    inventoryIds: character.equipment.inventory.map((i) => i.id),
    mountsIds: [],
    perks: [],
    perksIds: [],
    maneuvers: [],
    maneuversIds: [],
    states: [],
    statesIds: [],
    stances: [],
    stancesIds: [],
    powers: [],
    spells: [],
    spellsIds: [],
    powerSpecifications: [],
    powerSpecificationsIds: [],
  } as unknown as CharacterWithRelations;
}
