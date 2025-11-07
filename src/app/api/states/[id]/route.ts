import { type NextRequest, NextResponse } from 'next/server';
import { deleteState, updateState } from '@/persistence/states/statesRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'State ID is required' }, { status: 400 });
    const state = await request.json();
    if (!state) return NextResponse.json({ message: 'State data is required' }, { status: 400 });
    if (state.id !== id) return NextResponse.json({ message: 'State ID mismatch' }, { status: 400 });
    const updated = await updateState(state);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating state:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'State ID is required' }, { status: 400 });
    try 
    {
      await deleteState(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'State not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting state:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};