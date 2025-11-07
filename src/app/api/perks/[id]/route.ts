import { type NextRequest, NextResponse } from 'next/server';
import { deletePerk, updatePerk } from '@/persistence/perks/perksRepository';

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
    const updated = await updatePerk(perk);
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
      await deletePerk(id);
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