import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Power specification ID is required' }, { status: 400 });
    const powerSpecification = await request.json();
    if (!powerSpecification) return NextResponse.json({ message: 'Power specification data is required' }, { status: 400 });
    if (powerSpecification.id !== id) return NextResponse.json({ message: 'Power specification ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.powerSpecification);
    const updated = await repository.update(powerSpecification);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating power specification:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Power specification ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.powerSpecification);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Power specification not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting power specification:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};