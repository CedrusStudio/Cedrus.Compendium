import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const armor = await request.json();
    if (!armor) return NextResponse.json({ message: 'Armor data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.armor);
    const id = await repository.add(armor);
    if (!id) return NextResponse.json({ message: 'Failed to add armor' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding armor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
