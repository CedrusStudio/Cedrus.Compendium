import { type NextRequest, NextResponse } from 'next/server';
import { deleteArmor, updateArmor } from '@/persistence/equipment/armors/armorsRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Armor ID is required' }, { status: 400 });
    const armor = await request.json();
    if (!armor) return NextResponse.json({ message: 'Armor data is required' }, { status: 400 });
    if (armor.id !== id) return NextResponse.json({ message: 'Armor ID mismatch' }, { status: 400 });
    const updated = await updateArmor(armor);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating armor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Armor ID is required' }, { status: 400 });
    try 
    {
      await deleteArmor(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Armor not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting armor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
