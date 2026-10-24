import { validateFormBody } from "@/app/api/validateFormBody";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    let perk = await request.json().catch(() => null);
    const parsed = validateFormBody(perk, perkSchema);
    if (!parsed.success) return parsed.response;
    perk = parsed.data;
    if (!perk) return NextResponse.json({ message: 'Perk data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.perk);
    const id = await repository.add(perk);
    if (!id) return NextResponse.json({ message: 'Failed to add perk' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding perk:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
