import { validateFormBody } from "@/app/api/validateFormBody";
import { modeWithEffectsSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    let stance = await request.json().catch(() => null);
    const parsed = validateFormBody(stance, modeWithEffectsSchema);
    if (!parsed.success) return parsed.response;
    stance = parsed.data;
    if (!stance) return NextResponse.json({ message: 'Stance data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.stance);
    const id = await repository.add(stance);
    if (!id) return NextResponse.json({ message: 'Failed to add stance' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding stance:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
