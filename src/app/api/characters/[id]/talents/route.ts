import { type NextRequest, NextResponse } from 'next/server';
import { getCharacter, upsertCharacter } from '@/persistence/characterRepository';

type RouteParams = 
{
  params: 
  {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteParams)
{
  try 
  {
    const id = await params.id;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacter(id);
    if (!character) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    await upsertCharacter({...character, talents: [...(character.talents || []), await request.json()]});
    return NextResponse.json(character);
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};