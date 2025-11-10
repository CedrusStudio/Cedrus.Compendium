import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const mount = await request.json();
    if (!mount) return NextResponse.json({ message: 'Mount data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.mount);
    const id = await repository.add(mount);
    if (!id) return NextResponse.json({ message: 'Failed to add mount' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding mount:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
