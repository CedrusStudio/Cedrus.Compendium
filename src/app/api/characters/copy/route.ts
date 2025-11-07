import { type NextRequest, NextResponse } from 'next/server';
import { copyCreateCharacter } from '@/persistence/characters/charactersRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const copyCreateCharacterData = await request.json();
    const id = await copyCreateCharacter(copyCreateCharacterData);
    return NextResponse.json(id, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error creating character from template:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
