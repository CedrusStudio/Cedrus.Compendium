import { type NextRequest, NextResponse } from 'next/server';
import { deleteCharacter, getCharacterById } from '@/persistence/charactersRepository';

type RouteParams = Promise<{ id: string }>

export async function GET(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacterById(id);
    if (!character) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    return NextResponse.json(character);
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });

    try 
    {
      await deleteCharacter(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
