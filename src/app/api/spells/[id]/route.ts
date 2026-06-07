import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import type { SpellDto } from '@/persistence/schemas/characters/combat/powerSchema';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Spell ID is required' }, { status: 400 });
    const spell = await request.json();
    if (!spell) return NextResponse.json({ message: 'Spell data is required' }, { status: 400 });
    if (spell.id !== id) return NextResponse.json({ message: 'Spell ID mismatch' }, { status: 400 });
    const { id: _spellId, ...spellData } = toSpellPersistenceModel(spell as SpellDto);
    const updatedSpell = await prisma.spell.update({
      where: { id },
      data: spellData,
    });
    const updated = !!updatedSpell;
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating spell:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Spell ID is required' }, { status: 400 });
    try 
    {
      await prisma.spell.delete({ where: { id } });
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Spell not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting spell:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};