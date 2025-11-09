import { type NextRequest, NextResponse } from 'next/server';
import { deleteShield, updateShield } from '@/persistence/equipment/shields/shieldsRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Shield ID is required' }, { status: 400 });
    const shield = await request.json();
    if (!shield) return NextResponse.json({ message: 'Shield data is required' }, { status: 400 });
    if (shield.id !== id) return NextResponse.json({ message: 'Shield ID mismatch' }, { status: 400 });
    const updated = await updateShield(shield);
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
      await deleteShield(id);
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
