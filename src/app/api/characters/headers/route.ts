import { type NextRequest, NextResponse } from 'next/server';
import { getAllCharactersSummary } from '@/persistence/charactersRepository';
import { getSearchParamFromRequest } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = getSearchParamFromRequest(request);
    const characterHeaders = await getAllCharactersSummary(search);
    return NextResponse.json(characterHeaders);
  } 
  catch (error) 
  {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};