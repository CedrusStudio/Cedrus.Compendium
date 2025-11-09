import { type NextRequest, NextResponse } from 'next/server';
import { addWeapon } from '@/persistence/equipment/weapons/weaponsRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const weapon = await request.json();
    if (!weapon) return NextResponse.json({ message: 'Weapon data is required' }, { status: 400 });
    const id = await addWeapon(weapon);
    if (!id) return NextResponse.json({ message: 'Failed to add weapon' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding weapon:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
