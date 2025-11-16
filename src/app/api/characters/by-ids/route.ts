import { type NextRequest, NextResponse } from 'next/server';
import { getCharactersByIds } from '@/persistence/characters/charactersRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids)) 
    {
      return NextResponse.json({ message: 'Invalid request: ids must be an array' }, { status: 400 });
    }

    const characters = await getCharactersByIds(ids);
    return NextResponse.json(characters, { status: 200 });
  } 
  catch (error) 
  {
    console.error('Error fetching characters by IDs:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
