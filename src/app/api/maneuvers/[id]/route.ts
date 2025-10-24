import { type NextRequest, NextResponse } from 'next/server';
import { deleteManeuver, getManeuverById, updateManeuver } from '@/persistence/maneuversRepository';

type RouteParams = Promise<{ id: string }>

export async function GET(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Maneuver ID is required' }, { status: 400 });
    const maneuver = await getManeuverById(id);
    if (!maneuver) return NextResponse.json({ message: 'Maneuver not found' }, { status: 404 });
    return NextResponse.json(maneuver);
  } 
  catch (error) 
  {
    console.error('Error fetching maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Maneuver ID is required' }, { status: 400 });
    const updated = await updateManeuver(id, await request.json());
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error fetching maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Maneuver ID is required' }, { status: 400 });
    try 
    {
      await deleteManeuver(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Maneuver not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error fetching maneuver:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};