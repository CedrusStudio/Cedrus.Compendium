import { type NextRequest, NextResponse } from 'next/server';
import { deleteInventoryItem, updateInventoryItem } from '@/persistence/equipment/inventory/inventoryRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Inventory item ID is required' }, { status: 400 });
    const item = await request.json();
    if (!item) return NextResponse.json({ message: 'Inventory item data is required' }, { status: 400 });
    if (item.id !== id) return NextResponse.json({ message: 'Inventory item ID mismatch' }, { status: 400 });
    const updated = await updateInventoryItem(item);
    return NextResponse.json({ status: updated ? 200 : 500 });
  } 
  catch (error) 
  {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};

export async function DELETE(request: NextRequest, segmentData: { params: RouteParams })
{
  try 
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Inventory item ID is required' }, { status: 400 });
    try 
    {
      await deleteInventoryItem(id);
      return NextResponse.json({ status: 204 });
    } 
    catch 
    {
      return NextResponse.json({ message: 'Inventory item not found' }, { status: 404 });
    }
  } 
  catch (error) 
  {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
