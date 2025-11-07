import { type NextRequest, NextResponse } from 'next/server';
import { deleteSpell, updateSpell } from '@/persistence/spells/spellsRepository';

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
    const updated = await updateSpell(spell);
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
      await deleteSpell(id);
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