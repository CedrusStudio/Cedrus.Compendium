import { type NextRequest, NextResponse } from 'next/server';
import { getCharacter } from '@/persistence/characterRepository';
import { getIdParamFromRequest } from '@/persistence/cacheKeys';

export async function GET(request: NextRequest)
{
  try 
  {
    const id = getIdParamFromRequest(request);
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacter(id);
    return NextResponse.json(character);
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
