'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { toCharacter, toCharacterCombatPersistenceModel, toCharacterDetailsPersistenceModel, toCharacterHeaderPersistenceModel } from '@/persistence/mappings/chracterMapping';
import { Character } from '@/domain/characters/Character';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';

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

export async function getAllCharacters()
  : Promise<Character[]>
{
  const characters = await prisma.character.findMany
  ({
    include: includeAllRelations
  });

  return characters.map(toCharacter);
}

export async function searchCharacters(name: string)
  : Promise<Character[]>
{
  const characters = await prisma.character.findMany
  ({
    where: {
      name: {
        contains: name,
        mode: 'insensitive'
      }
    },
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

export async function deleteCharacter(id: string)
  : Promise<void>
{
  await prisma.character.delete
  ({
    where: { id }
  });
}

export async function updateCharacterStatistics(id: string, characterStatistics: StatisticsDto)
  : Promise<void>
{
  await prisma.character.update
  ({
    where: { id },
    data: characterStatistics
  });
}

export async function updateCharacterTalents(id: string, characterTalents: TalentsDto)
  : Promise<void>
{
  await prisma.character.update
  ({
    where: { id },
    data: characterTalents
  });
}

export async function updateCharacterEquipment(id: string, characterEquipment: EquipmentDto)
  : Promise<void>
{
  await prisma.character.update
  ({
    where: { id },
    data: characterEquipment
  });
}

export async function updateCharacterDetails(id: string, characterDetails: DetailsDto)
  : Promise<void>
{
  const characterDetailsPersistenceModel = toCharacterDetailsPersistenceModel(characterDetails);
  await prisma.character.update
  ({
    where: { id },
    data: characterDetailsPersistenceModel
  });
}

export async function updateCharacterCombat(id: string, characterCombat: CombatDto)
  : Promise<void>
{
  const characterCombatPersistenceModel = toCharacterCombatPersistenceModel(characterCombat);
  await prisma.character.update
  ({
    where: { id },
    data: characterCombatPersistenceModel
  });
}