import { type NextRequest, NextResponse } from 'next/server';
import { addCharacter } from '@/persistence/characters/charactersRepository';

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
