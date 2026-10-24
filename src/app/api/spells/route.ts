import { validateFormBody } from "@/app/api/validateFormBody";
import { spellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import type { SpellDto } from '@/persistence/schemas/characters/combat/powerSchema';

export async function POST(request: NextRequest)
{
  try 
  {
    let spell = await request.json().catch(() => null);
    const parsed = validateFormBody(spell, spellSchema);
    if (!parsed.success) return parsed.response;
    spell = parsed.data;
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
