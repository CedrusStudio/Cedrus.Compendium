import { type NextRequest, NextResponse } from 'next/server';
import { addCharacter, getAllCharacters, searchCharacters } from '@/persistence/charactersRepository';
import { getSearchParamFromRequest } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = getSearchParamFromRequest(request);
    const characters = search ? await searchCharacters(search) : await getAllCharacters();
    return NextResponse.json(characters);
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function POST(request: NextRequest)
{
  try 
  {
    const characterData = await request.json();
    const character = await addCharacter(characterData);
    return NextResponse.json(character);
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
