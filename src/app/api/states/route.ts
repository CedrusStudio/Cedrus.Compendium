import { type NextRequest, NextResponse } from 'next/server';
import { addState } from '@/persistence/states/statesRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const state = await request.json();
    if (!state) return NextResponse.json({ message: 'State data is required' }, { status: 400 });
    const id = await addState(state);
    if (!id) return NextResponse.json({ message: 'Failed to add state' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding state:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
