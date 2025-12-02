import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const race = await request.json();
    if (!race) return NextResponse.json({ message: 'Race data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.race);
    const id = await repository.add(race);
    if (!id) return NextResponse.json({ message: 'Failed to add race' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding race:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
