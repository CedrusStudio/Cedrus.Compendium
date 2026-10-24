import { type NextRequest, NextResponse } from 'next/server';
import { copyCreateCharacter } from '@/persistence/characters/charactersRepository';
import { copyCreateCharacterSchema } from '@/persistence/schemas/characters/copyCharacterSchema';
import { validateFormBody } from '@/app/api/validateFormBody';

export async function POST(request: NextRequest)
{
  try 
  {
    const parsed = validateFormBody(await request.json().catch(() => null), copyCreateCharacterSchema);
    if (!parsed.success) return parsed.response;
    const id = await copyCreateCharacter(parsed.data);
    return NextResponse.json(id, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error creating character from template:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
