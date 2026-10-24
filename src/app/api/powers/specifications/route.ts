import { validateFormBody } from "@/app/api/validateFormBody";
import { powerSpecificationSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    let powerSpecification = await request.json().catch(() => null);
    const parsed = validateFormBody(powerSpecification, powerSpecificationSchema);
    if (!parsed.success) return parsed.response;
    powerSpecification = parsed.data;
    if (!powerSpecification) return NextResponse.json({ message: 'Power specification data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.powerSpecification);
    const id = await repository.add(powerSpecification);
    if (!id) return NextResponse.json({ message: 'Failed to add power specification' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding power specification:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
