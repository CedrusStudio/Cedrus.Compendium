import { type NextRequest, NextResponse } from 'next/server';
import { addPerk } from '@/persistence/perks/perksRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const perk = await request.json();
    if (!perk) return NextResponse.json({ message: 'Perk data is required' }, { status: 400 });
    const id = await addPerk(perk);
    if (!id) return NextResponse.json({ message: 'Failed to add perk' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding perk:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
