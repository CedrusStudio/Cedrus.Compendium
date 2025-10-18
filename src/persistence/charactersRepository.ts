'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { Character } from '@/domain/characters/Character';
import { Character as CharacterPersistenceModel } from '@/generated/prisma/client';

export async function getCharacterById(id: string)
  : Promise<CharacterPersistenceModel | null>
  // : Promise<Character | null>
{
  try 
  {
    const character = await prisma.character.findUnique({
      where: { id }
    });

    return character;
    // return character ? mapToDomain(character) : null;
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    throw new Error('Failed to fetch characters');
  }
}

//Finish Mapping function
function mapToDomain(characterPersistenceModel: CharacterPersistenceModel): Character
{
  return {
    id: characterPersistenceModel.id,
    name: characterPersistenceModel.name,
    shortName: characterPersistenceModel.shortName,
    description: characterPersistenceModel.description,
  };
}