import { validateFormBody } from "@/app/api/validateFormBody";
import { armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Armor ID is required' }, { status: 400 });
    let armor = await request.json().catch(() => null);
    const parsed = validateFormBody(armor, armorSchema);
    if (!parsed.success) return parsed.response;
    armor = parsed.data;
    if (!armor) return NextResponse.json({ message: 'Armor data is required' }, { status: 400 });
    if (armor.id !== id) return NextResponse.json({ message: 'Armor ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.armor);
    const updated = await repository.update(armor);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating armor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Armor ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.armor);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Armor not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting armor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
