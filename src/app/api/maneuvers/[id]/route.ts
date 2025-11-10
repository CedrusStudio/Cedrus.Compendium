import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Maneuver ID is required' }, { status: 400 });
    const maneuver = await request.json();
    if (!maneuver) return NextResponse.json({ message: 'Maneuver data is required' }, { status: 400 });
    if (maneuver.id !== id) return NextResponse.json({ message: 'Maneuver ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.maneuver);
    const updated = await repository.update(maneuver);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Maneuver ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.maneuver);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Maneuver not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};