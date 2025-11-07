import { type NextRequest, NextResponse } from 'next/server';
import { addSpell } from '@/persistence/spells/spellsRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const spell = await request.json();
    if (!spell) return NextResponse.json({ message: 'Spell data is required' }, { status: 400 });
    const id = await addSpell(spell);
    if (!id) return NextResponse.json({ message: 'Failed to add spell' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding spell:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
