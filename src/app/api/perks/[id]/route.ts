import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Perk ID is required' }, { status: 400 });
    const perk = await request.json();
    if (!perk) return NextResponse.json({ message: 'Perk data is required' }, { status: 400 });
    if (perk.id !== id) return NextResponse.json({ message: 'Perk ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.perk);
    const updated = await repository.update(perk);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating perk:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Perk ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.perk);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Perk not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting perk:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};