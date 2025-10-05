import { type NextRequest, NextResponse } from 'next/server';
import { deleteCharacter, getCharacter, upsertCharacter } from '@/persistence/characterRepository';
import { getIdParamFromLastRequestSegment } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const id = getIdParamFromLastRequestSegment(request);
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacter(id);
    if (!character) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    return NextResponse.json(character);
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest)
{
  try 
  {
    const id = getIdParamFromLastRequestSegment(request);
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const character = await getCharacter(id);
    if (!character) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    await deleteCharacter(id);
    return NextResponse.json({ status: 204 });
  } 
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function PUT(request: NextRequest)
{
  try 
  {
    const id = getIdParamFromLastRequestSegment(request);
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const characterData = await request.json();
    await upsertCharacter(characterData);
    return NextResponse.json({ status: 200 });
  }
  catch (error) 
  {
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
