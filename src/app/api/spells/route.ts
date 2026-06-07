import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import type { SpellDto } from '@/persistence/schemas/characters/combat/powerSchema';

export async function POST(request: NextRequest)
{
  try 
  {
    const spell = await request.json();
    if (!spell) return NextResponse.json({ message: 'Spell data is required' }, { status: 400 });
    const createdSpell = await prisma.spell.create({
      data: {
        ...toSpellPersistenceModel(spell as SpellDto),
        characterIds: [],
      },
    });
    const id = createdSpell.id;
    if (!id) return NextResponse.json({ message: 'Failed to add spell' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding spell:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
