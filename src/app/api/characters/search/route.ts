import { type NextRequest, NextResponse } from 'next/server';
import { searchCharactersWithPayload } from '@/persistence/charactersRepository';
import { type SearchPayload } from '@/common/global/SearchPayload';

export async function POST(request: NextRequest)
{
  try 
  {
    const searchPayload: SearchPayload = await request.json();
    const characters = await searchCharactersWithPayload(searchPayload);
    return NextResponse.json(characters);
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};