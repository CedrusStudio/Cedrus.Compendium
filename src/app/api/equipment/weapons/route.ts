import { validateFormBody } from "@/app/api/validateFormBody";
import { weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    let weapon = await request.json().catch(() => null);
    const parsed = validateFormBody(weapon, weaponSchema);
    if (!parsed.success) return parsed.response;
    weapon = parsed.data;
    if (!weapon) return NextResponse.json({ message: 'Weapon data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.weapon);
    const id = await repository.add(weapon);
    if (!id) return NextResponse.json({ message: 'Failed to add weapon' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding weapon:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
