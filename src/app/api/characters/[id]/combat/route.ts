import { type NextRequest, NextResponse } from 'next/server';
import { updateCharacterCombat } from '@/persistence/characters/charactersRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const updated = await updateCharacterCombat(id, await request.json());
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};