import { type NextRequest, NextResponse } from 'next/server';
import { addCharacter, searchCharacters } from '@/persistence/charactersRepository';
import { getSearchParamFromRequest } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = getSearchParamFromRequest(request);
    const characters = await searchCharacters(search);
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
    const id = await addCharacter(characterData);
    return NextResponse.json(id, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
