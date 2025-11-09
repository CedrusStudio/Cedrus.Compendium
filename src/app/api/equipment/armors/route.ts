import { type NextRequest, NextResponse } from 'next/server';
import { addArmor } from '@/persistence/equipment/armors/armorsRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const armor = await request.json();
    if (!armor) return NextResponse.json({ message: 'Armor data is required' }, { status: 400 });
    const id = await addArmor(armor);
    if (!id) return NextResponse.json({ message: 'Failed to add armor' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding armor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
