import { type NextRequest, NextResponse } from 'next/server';
import { getAllCharacters, searchCharacter } from '@/persistence/characterRepository';
import { getSearchParamFromRequest } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = getSearchParamFromRequest(request);
    const characters = search ? await searchCharacter(search) : await getAllCharacters();
    return NextResponse.json(characters);
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
