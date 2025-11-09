import { type NextRequest, NextResponse } from 'next/server';
import { addInventoryItem } from '@/persistence/equipment/inventory/inventoryRepository';

export async function POST(request: NextRequest)
{
  try 
  {
    const item = await request.json();
    if (!item) return NextResponse.json({ message: 'Inventory item data is required' }, { status: 400 });
    const id = await addInventoryItem(item);
    if (!id) return NextResponse.json({ message: 'Failed to add inventory item' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } 
  catch (error) 
  {
    console.error('Error adding inventory item:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
