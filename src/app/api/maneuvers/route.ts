import { type NextRequest, NextResponse } from 'next/server';
import { addManeuver, searchManeuvers } from '@/persistence/maneuversRepository';
import { getSearchParamFromRequest, getSortParamFromRequest } from '@/common/global/httpUtils';

export async function GET(request: NextRequest)
{
  try 
  {
    const search = getSearchParamFromRequest(request);
    const sort = getSortParamFromRequest(request);
    const maneuvers = await searchManeuvers(search, sort);
    return NextResponse.json(maneuvers);
  } 
  catch (error) 
  {
    console.error('Error fetching maneuvers:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function POST(request: NextRequest)
{
  try 
  {
    const maneuver = await request.json();
    if (!maneuver) return NextResponse.json({ message: 'Maneuver data is required' }, { status: 400 });
    const id = await addManeuver(maneuver);
    if (!id) return NextResponse.json({ message: 'Failed to add maneuver' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
