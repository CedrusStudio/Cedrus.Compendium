import { type NextRequest, NextResponse } from 'next/server';
import { updateCharacterDetails } from '@/persistence/characters/charactersRepository';
import { CharacterValidationError } from '@/persistence/characters/characterErrors';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const updated = await updateCharacterDetails(id, await request.json());
    if (!updated) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    return NextResponse.json({ status: 200 });
  }
  catch (error)
  {
    if (error instanceof CharacterValidationError)
    {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error('Error updating character details:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};