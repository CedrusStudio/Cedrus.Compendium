import { type NextRequest, NextResponse } from 'next/server';
import { addStance } from '@/persistence/stances/stancesRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const stance = await request.json();
    if (!stance) return NextResponse.json({ message: 'Stance data is required' }, { status: 400 });
    const id = await addStance(stance);
    if (!id) return NextResponse.json({ message: 'Failed to add stance' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding stance:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
