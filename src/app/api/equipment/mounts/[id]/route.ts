import { type NextRequest, NextResponse } from 'next/server';
import { deleteMount, updateMount } from '@/persistence/equipment/mounts/mountsRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Mount ID is required' }, { status: 400 });
    const mount = await request.json();
    if (!mount) return NextResponse.json({ message: 'Mount data is required' }, { status: 400 });
    if (mount.id !== id) return NextResponse.json({ message: 'Mount ID mismatch' }, { status: 400 });
    const updated = await updateMount(mount);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating mount:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Mount ID is required' }, { status: 400 });
    try 
    {
      await deleteMount(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Mount not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting mount:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
