'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';

export async function getCharacters() 
{
  try 
  {
    const characters = await prisma.characters.findMany();
    return characters;
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    throw new Error('Failed to fetch characters');
  }
}