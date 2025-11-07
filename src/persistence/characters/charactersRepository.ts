'use server';

//Tip: mark your repository as server-only so it can't be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { toCharacterCombatPersistenceModel, toCharacterDetailsPersistenceModel, toCharacterFromCopyPersistenceModel, toCharacterHeaderPersistenceModel } from '@/persistence/mappings/characterMapping';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { CopyCreateCharacterDto } from '@/persistence/schemas/characters/copyCharacterSchema';

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
  const existingOnCharacterPerkIdsResponse = await prisma.character.findUnique
  ({ 
    where: { id },
    select: { perksIds: true }
  });

  if (!existingOnCharacterPerkIdsResponse) return false;

  const existingPerkIdsResponse = await prisma.perk.findMany
  ({ 
    where: { id: {
      in: characterDetails.perks.map(perk => perk.id).filter(id => !existingOnCharacterPerkIdsResponse.perksIds.includes(id))
    } },
    select: { id: true }
  });

  if (!existingPerkIdsResponse) return false;

  const characterDetailsPersistenceModel = toCharacterDetailsPersistenceModel
  (
    characterDetails, 
    existingOnCharacterPerkIdsResponse.perksIds,
    existingPerkIdsResponse.map(perk => perk.id)
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
    select: { 
      stancesIds: true,
      statesIds: true,
      maneuversIds: true,
      spellsIds: true
    }
  });

  if (!idsOnCharacter) return false;

  //Maneuvers
  const existingManeuverIdsResponse = await prisma.maneuver.findMany
  ({ 
    where: { id: {
      in: characterCombat.maneuvers.map(maneuver => maneuver.id).filter(id => !idsOnCharacter.maneuversIds.includes(id))
    } },
    select: { id: true }
  });

  if (!existingManeuverIdsResponse) return false;

  //Stances
  const existingStanceIdsResponse = await prisma.stance.findMany
  ({ 
    where: { id: {
      in: characterCombat.stances.map(stance => stance.id).filter(id => !idsOnCharacter.stancesIds.includes(id))
    } },
    select: { id: true }
  });

  if (!existingStanceIdsResponse) return false;

  //States
  const existingStateIdsResponse = await prisma.state.findMany
  ({ 
    where: { id: {
      in: characterCombat.states.map(state => state.id).filter(id => !idsOnCharacter.statesIds.includes(id))
    } },
    select: { id: true }
  });

  if (!existingStateIdsResponse) return false;

  //Spells
  const existingSpellIdsResponse = await prisma.spell.findMany
  ({ 
    where: { id: {
      in: characterCombat.powers.flatMap(power => power.spells.map(spell => spell.id)).filter(id => !idsOnCharacter.spellsIds.includes(id))
    } },
    select: { id: true }
  });

  if (!existingSpellIdsResponse) return false;

  const characterCombatPersistenceModel = toCharacterCombatPersistenceModel
  (
    characterCombat, 
    idsOnCharacter.stancesIds,
    existingStanceIdsResponse.map(perk => perk.id),
    idsOnCharacter.statesIds, 
    existingStateIdsResponse.map(maneuver => maneuver.id),
    idsOnCharacter.maneuversIds, 
    existingManeuverIdsResponse.map(maneuver => maneuver.id),
    idsOnCharacter.spellsIds,
    existingSpellIdsResponse.map(maneuver => maneuver.id)
  );

  const updatedCharacter = await prisma.character.update
  ({
    where: { id },
    data: characterCombatPersistenceModel
  });

  return !!updatedCharacter;
}