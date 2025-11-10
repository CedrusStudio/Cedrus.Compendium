import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const inventoryItem = await request.json();
    if (!inventoryItem) return NextResponse.json({ message: 'InventoryItem data is required' }, { status: 400 });
    const repository = await createCommonRepository(prisma.inventoryItem);
    const id = await repository.add(inventoryItem);
    if (!id) return NextResponse.json({ message: 'Failed to add inventoryItem' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding inventoryItem:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
