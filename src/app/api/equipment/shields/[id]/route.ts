import { validateFormBody } from "@/app/api/validateFormBody";
import { shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Shield ID is required' }, { status: 400 });
    let shield = await request.json().catch(() => null);
    const parsed = validateFormBody(shield, shieldSchema);
    if (!parsed.success) return parsed.response;
    shield = parsed.data;
    if (!shield) return NextResponse.json({ message: 'Shield data is required' }, { status: 400 });
    if (shield.id !== id) return NextResponse.json({ message: 'Shield ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.shield);
    const updated = await repository.update(shield);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating shield:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Shield ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.shield);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Shield not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting shield:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
