import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const shield = await request.json();
    if (!shield) return NextResponse.json({ message: 'Shield data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.shield);
    const id = await repository.add(shield);
    if (!id) return NextResponse.json({ message: 'Failed to add shield' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding shield:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
