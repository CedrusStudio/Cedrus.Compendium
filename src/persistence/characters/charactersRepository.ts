'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { toCharacter, toCharacterCombatPersistenceModel, toCharacterDetailsPersistenceModel, toCharacterHeaderPersistenceModel } from '@/persistence/mappings/characterMapping';
import { Character } from '@/domain/characters/Character';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/createCharacterQuery";

//Queries
export async function getCharacterById(id: string)
  : Promise<Character | null>
{
  const character = await prisma.character.findUnique
  ({ 
    where: { id },
    include: includeAllRelations
  });

  return character ? toCharacter(character) : null;
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
  //WHEN THE EQUIPMENT HAS RELATIONS, UPDATE LOGIC MUST BE ADDED HERE
  const characterToUpdate = await prisma.character.findUnique({ where: { id } });
  if (!characterToUpdate) return false;

  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: 
    {
      equipment: characterEquipment
    }
  });

  return !!updatedCharacter;
}

export async function updateCharacterDetails(id: string, characterDetails: DetailsDto)
  : Promise<boolean>
{
  const existingPerkIdsResponse = await prisma.character.findUnique
  ({ 
    where: { id },
    select: { perksIds: true }
  });

  if (!existingPerkIdsResponse) return false;

  const characterDetailsPersistenceModel = toCharacterDetailsPersistenceModel(characterDetails, existingPerkIdsResponse.perksIds);
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
  const idsToUpdate = await prisma.character.findUnique
  ({ 
    where: { id },
    select: { 
      stancesIds: true,
      statesIds: true,
      maneuversIds: true,
      spellsIds: true
    }
  });

  if (!idsToUpdate) return false;

  const characterCombatPersistenceModel = toCharacterCombatPersistenceModel(characterCombat, idsToUpdate.stancesIds, idsToUpdate.statesIds, idsToUpdate.maneuversIds, idsToUpdate.spellsIds);
  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterCombatPersistenceModel
  });

  return !!updatedCharacter;
}