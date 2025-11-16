'use server';

//Tip: mark your repository as server-only so it can't be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { toCharacterCombatPersistenceModel, toCharacterDetailsPersistenceModel, toCharacterEquipmentPersistenceModel, toCharacterFromCopyPersistenceModel, toCharacterHeaderPersistenceModel } from '@/persistence/mappings/characterMapping';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { CopyCreateCharacterDto } from '@/persistence/schemas/characters/copyCharacterSchema';
import { Character } from '@/domain/characters/Character';
import { toCharacter } from '@/persistence/mappings/characterMapping';
import { includeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';

//Queries
export async function getCharactersByIds(ids: string[])
  : Promise<Character[]>
{
  if (ids.length === 0) return [];

  const characters = await prisma.character.findMany
  ({
    where: { id: { in: ids } },
    include: includeAllRelations
  });

  return characters.map(toCharacter);
}

//Commands
export async function addCharacter(characterHeader: HeaderDto)
  : Promise<string>
{
  const characterHeaderPersistenceModel = toCharacterHeaderPersistenceModel(characterHeader);
  const character = await prisma.character.create
  ({
    data: characterHeaderPersistenceModel
  });

  return character.id;
}

export async function copyCreateCharacter(copyCreateCharacterData: CopyCreateCharacterDto)
  : Promise<string>
{
  const characterHeaderPersistenceModel = toCharacterFromCopyPersistenceModel(copyCreateCharacterData);
  const character = await prisma.character.create
  ({
    data: characterHeaderPersistenceModel
  });

  return character.id;
}

export async function deleteCharacter(id: string)
  : Promise<void>
{
  await prisma.character.delete
  ({
    where: { id }
  });
}

export async function updateCharacterStatistics(id: string, characterStatistics: StatisticsDto)
  : Promise<boolean>
{
  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterStatistics
  });

  return !!updatedCharacter;
}

export async function updateCharacterTalents(id: string, characterTalents: TalentsDto)
  : Promise<boolean>
{
  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterTalents
  });

  return !!updatedCharacter;
}

export async function updateCharacterEquipment(id: string, characterEquipment: EquipmentDto)
  : Promise<boolean>
{
  const characterToUpdate = await prisma.character.findUnique
  ({ 
    where: { id },
    select: 
    { 
      weaponsIds: true,
      armorsIds: true,
      shieldsIds: true,
      inventoryIds: true,
      mountsIds: true
    }
  });

  if (!characterToUpdate) return false;

  const existingWeaponIds = await fetchExistingEntityIds(prisma.weapon, characterEquipment.weapons, characterToUpdate.weaponsIds);
  const existingArmorIds = await fetchExistingEntityIds(prisma.armor, characterEquipment.armors, characterToUpdate.armorsIds);
  const existingShieldIds = await fetchExistingEntityIds(prisma.shield, characterEquipment.shields, characterToUpdate.shieldsIds);
  const existingInventoryIds = await fetchExistingEntityIds(prisma.inventoryItem, characterEquipment.inventory, characterToUpdate.inventoryIds);
  const existingMountIds = await fetchExistingEntityIds(prisma.mount, characterEquipment.mounts, characterToUpdate.mountsIds);
  
  const characterEquipmentPersistenceModel = toCharacterEquipmentPersistenceModel
  (
    characterEquipment, 
    characterToUpdate.weaponsIds,
    existingWeaponIds,
    characterToUpdate.armorsIds, 
    existingArmorIds,
    characterToUpdate.shieldsIds, 
    existingShieldIds,
    characterToUpdate.inventoryIds,
    existingInventoryIds,
    characterToUpdate.mountsIds,
    existingMountIds
  );

  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterEquipmentPersistenceModel
  });

  return !!updatedCharacter;
}

export async function updateCharacterDetails(id: string, characterDetails: DetailsDto)
  : Promise<boolean>
{
  const existingOnCharacterPerkIdsResponse = await prisma.character.findUnique
  ({ 
    where: { id },
    select: { perksIds: true }
  });

  if (!existingOnCharacterPerkIdsResponse) return false;

  // Fetch existing perk IDs
  const existingPerkIds = await fetchExistingEntityIds(prisma.perk, characterDetails.perks, existingOnCharacterPerkIdsResponse.perksIds);

  const characterDetailsPersistenceModel = toCharacterDetailsPersistenceModel
  (
    characterDetails, 
    existingOnCharacterPerkIdsResponse.perksIds,
    existingPerkIds
  );

  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterDetailsPersistenceModel
  });

  return !!updatedCharacter;
}

export async function updateCharacterCombat(id: string, characterCombat: CombatDto)
  : Promise<boolean>
{
  const idsOnCharacter = await prisma.character.findUnique
  ({ 
    where: { id },
    select: 
    { 
      stancesIds: true,
      statesIds: true,
      maneuversIds: true,
      spellsIds: true
    }
  });

  if (!idsOnCharacter) return false;

  const existingManeuverIds = await fetchExistingEntityIds(prisma.maneuver, characterCombat.maneuvers, idsOnCharacter.maneuversIds, );
  const existingStanceIds = await fetchExistingEntityIds(prisma.stance, characterCombat.stances, idsOnCharacter.stancesIds);
  const existingStateIds = await fetchExistingEntityIds(prisma.state, characterCombat.states, idsOnCharacter.statesIds);
  
  // Spells need special handling because they come from powers
  const spellEntities = characterCombat.powers.flatMap(power => power.spells);
  const existingSpellIds = await fetchExistingEntityIds(prisma.spell, spellEntities, idsOnCharacter.spellsIds);

  const characterCombatPersistenceModel = toCharacterCombatPersistenceModel
  (
    characterCombat, 
    idsOnCharacter.stancesIds,
    existingStanceIds,
    idsOnCharacter.statesIds, 
    existingStateIds,
    idsOnCharacter.maneuversIds, 
    existingManeuverIds,
    idsOnCharacter.spellsIds,
    existingSpellIds
  );

  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterCombatPersistenceModel
  });

  return !!updatedCharacter;
}

//Private functions

/**
 * Fetches existing entity IDs that are not already present in the existingIds array.
 * @param entities - Array of entities to check.
 * @param existingIds - Array of existing entity IDs.
 * @param prismaModel - Prisma model with a findMany method.
 * @returns Promise resolving to an array of existing entity IDs.
 */
async function fetchExistingEntityIds<T extends { id: string }>
(
  prismaModel: { findMany: (args: { where: { id: { in: string[] } }; select: { id: true } }) => Promise<{ id: string }[]> },
  entities: T[],
  existingIds: string[]
)
  : Promise<string[]>
{
  const idsToCheck = entities.map(entity => entity.id).filter(id => !existingIds.includes(id));
  
  if (idsToCheck.length === 0) return [];

  const existingEntitiesResponse = await prismaModel.findMany
  ({
    where: { id: { in: idsToCheck } },
    select: { id: true }
  });

  return existingEntitiesResponse.map((entity: { id: string }) => entity.id);
}