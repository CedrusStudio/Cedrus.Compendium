import { type NextRequest, NextResponse } from 'next/server';
import { deleteStance, updateStance } from '@/persistence/stances/stancesRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Stance ID is required' }, { status: 400 });
    const stance = await request.json();
    if (!stance) return NextResponse.json({ message: 'Stance data is required' }, { status: 400 });
    if (stance.id !== id) return NextResponse.json({ message: 'Stance ID mismatch' }, { status: 400 });
    const updated = await updateStance(stance);
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
      await deleteStance(id);
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