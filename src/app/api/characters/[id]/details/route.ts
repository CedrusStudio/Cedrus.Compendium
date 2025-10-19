import { type NextRequest, NextResponse } from 'next/server';
import { getCharacterById, updateCharacterDetails } from '@/persistence/charactersRepository';

type RouteParams = 
{
  params: 
  {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: RouteParams)
{
  try 
  {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacterById(id);
    if (!character) return NextResponse.json({ message: 'Character not found' }, { status: 404 });

    await updateCharacterDetails(id, await request.json());
    return NextResponse.json(character);
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};