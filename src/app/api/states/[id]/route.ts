import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'State ID is required' }, { status: 400 });
    const state = await request.json();
    if (!state) return NextResponse.json({ message: 'State data is required' }, { status: 400 });
    if (state.id !== id) return NextResponse.json({ message: 'State ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.state);
    const updated = await repository.update(state);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating state:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'State ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.state);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'State not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting state:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};