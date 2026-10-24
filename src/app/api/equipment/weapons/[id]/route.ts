import { validateFormBody } from "@/app/api/validateFormBody";
import { weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Weapon ID is required' }, { status: 400 });
    let weapon = await request.json().catch(() => null);
    const parsed = validateFormBody(weapon, weaponSchema);
    if (!parsed.success) return parsed.response;
    weapon = parsed.data;
    if (!weapon) return NextResponse.json({ message: 'Weapon data is required' }, { status: 400 });
    if (weapon.id !== id) return NextResponse.json({ message: 'Weapon ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.weapon);
    const updated = await repository.update(weapon);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating weapon:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Weapon ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.weapon);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Weapon not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting weapon:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
