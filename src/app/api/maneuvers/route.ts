import { toCastablePersistenceModel } from "@/persistence/mappings/castableMapping";
import { validateFormBody } from "@/app/api/validateFormBody";
import { maneuverWithEffectsSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    let maneuver = await request.json().catch(() => null);
    const parsed = validateFormBody(maneuver, maneuverWithEffectsSchema);
    if (!parsed.success) return parsed.response;
    maneuver = parsed.data;
    if (!maneuver) return NextResponse.json({ message: 'Maneuver data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.maneuver);
    const id = await repository.add(toCastablePersistenceModel(maneuver));
    if (!id) return NextResponse.json({ message: 'Failed to add maneuver' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
