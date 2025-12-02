import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Race ID is required' }, { status: 400 });
    const race = await request.json();
    if (!race) return NextResponse.json({ message: 'Race data is required' }, { status: 400 });
    if (race.id !== id) return NextResponse.json({ message: 'Race ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.race);
    const updated = await repository.update(race);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating race:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Race ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.race);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Race not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting race:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
