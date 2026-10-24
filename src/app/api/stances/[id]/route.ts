import { validateFormBody } from "@/app/api/validateFormBody";
import { modeWithEffectsSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { type NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { createCommonRepository } from '@/persistence/common/createCommonRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Stance ID is required' }, { status: 400 });
    let stance = await request.json().catch(() => null);
    const parsed = validateFormBody(stance, modeWithEffectsSchema);
    if (!parsed.success) return parsed.response;
    stance = parsed.data;
    if (!stance) return NextResponse.json({ message: 'Stance data is required' }, { status: 400 });
    if (stance.id !== id) return NextResponse.json({ message: 'Stance ID mismatch' }, { status: 400 });
    const repository = await createCommonRepository(prisma.stance);
    const updated = await repository.update(stance);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating stance:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Stance ID is required' }, { status: 400 });
    try 
    {
      const repository = await createCommonRepository(prisma.stance);
      await repository.delete(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Stance not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting stance:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};