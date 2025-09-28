import { type NextRequest, NextResponse } from 'next/server';
import { getAllCharacters, searchCharacter } from '@/persistence/characterRepository';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = request.nextUrl.searchParams.get('search');
    const data = search ? await searchCharacter(search) : await getAllCharacters();
    return NextResponse.json(data);
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
