import { type NextRequest, NextResponse } from 'next/server';
import { getCharacterById, updateCharacterTalents } from '@/persistence/charactersRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacterById(id);
    if (!character) return NextResponse.json({ message: 'Character not found' }, { status: 404 });

    await updateCharacterTalents(id, await request.json());
    return NextResponse.json({ status: 200 });
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};