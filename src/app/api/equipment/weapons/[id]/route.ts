import { type NextRequest, NextResponse } from 'next/server';
import { deleteWeapon, updateWeapon } from '@/persistence/equipment/weapons/weaponsRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Weapon ID is required' }, { status: 400 });
    const weapon = await request.json();
    if (!weapon) return NextResponse.json({ message: 'Weapon data is required' }, { status: 400 });
    if (weapon.id !== id) return NextResponse.json({ message: 'Weapon ID mismatch' }, { status: 400 });
    const updated = await updateWeapon(weapon);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating weapon:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Weapon ID is required' }, { status: 400 });
    try 
    {
      await deleteWeapon(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Weapon not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting weapon:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
