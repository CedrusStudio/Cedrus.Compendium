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
import { SearchPayload, Select } from '@/common/global/SearchPayload';
import { CharacterFindManyArgs } from '@/generated/prisma/models';

//Queries
const includeAllRelations =
{
  stances: true,
  states: true,
  maneuvers: true,
  spells: true,
  perks: true
};

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

export type CharacterSummary = ({id: string} & Omit<HeaderDto, 'category'>);

export async function getAllCharactersSummary(name: string | undefined | null)
  : Promise<CharacterSummary[]>
{
  const characterHeaders = await prisma.character.findMany
  ({
    where: {
      name: name ? {
        contains: name,
        mode: 'insensitive'
      } : undefined
    },
    select: {
      id: true,
      name: true,
      shortName: true,
      description: true,
    }
  });

  return characterHeaders;
}

export async function searchCharacters(name: string | undefined | null)
  : Promise<Character[]>
{
  const characters = await prisma.character.findMany
  ({
    where: {
      name: name ? {
        contains: name,
        mode: 'insensitive'
      } : undefined
    },
    include: includeAllRelations
  });

  return characters.map(toCharacter);
}

export async function searchCharactersWithPayload(payload: SearchPayload)
  : Promise<any[]>
{
  const filters = !payload.search
    ? {}
    : Object.fromEntries(
        Object.entries(payload.search)
          .filter(([_, value]) => !!value)
          .map(([key, value]) => [
            key,
            { contains: value, mode: "insensitive" }
          ])
      );

  const sorting = payload.sort || {};

  const mapping = payload.select ? createMapping(payload.select) : {};

  function createMapping(select: Select)
  {
    const mapping: any = {};

    for (const [key, value] of Object.entries(select))
    {
      if (typeof value === 'object')
      {
        mapping[key] = { select: createMapping(value) };
      }
      
      mapping[key] = value;
    }
    
    return mapping;
  }

  let findInput: CharacterFindManyArgs = {
    where: filters,
    orderBy: sorting,
  };

  if (payload.select)
  {
    findInput = {
      ...findInput,
      select: mapping
    };
  }
  else
  {
    findInput = {
      ...findInput,
      include: includeAllRelations
    };
  }

  if (payload.pagination)
  {
    const { pageSize, pageNumber, cursor } = payload.pagination;

    // findInput = {
    //   ...findInput,
    //   take: pageSize,
    //   skip: pageSize * (pageNumber - 1)
    // };

    const newfilters =
    {
      ...filters,
      id: cursor ? { gt: cursor } : undefined
    }
    findInput.where = newfilters;

    findInput = {
      ...findInput,
      take: pageSize
    };
  }

  console.log(findInput);
  return await prisma.character.findMany(findInput);
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