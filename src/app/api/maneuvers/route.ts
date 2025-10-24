import { type NextRequest, NextResponse } from 'next/server';
import { searchManeuvers } from '@/persistence/maneuversRepository';
import { getSearchParamFromRequest } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = getSearchParamFromRequest(request);
    const maneuvers = await searchManeuvers(search);
    return NextResponse.json(maneuvers);
  } 
  catch (error) 
  {
    console.error('Error fetching maneuvers:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
