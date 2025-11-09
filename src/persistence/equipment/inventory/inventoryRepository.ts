'use server';

import 'server-only';
import prisma from "@/lib/prisma";
import { InventoryItemDto } from "@/persistence/schemas/characters/equipment/itemSchema";

export async function deleteInventoryItem(id: string)
  : Promise<void>
{
  await prisma.inventoryItem.delete
  ({
    where: { id }
  });
}

export async function addInventoryItem(item: InventoryItemDto)
  : Promise<string>
{
  const added = await prisma.inventoryItem.create
  ({
    data: item
  });

  return added.id;
}

export async function updateInventoryItem(item: InventoryItemDto)
  : Promise<boolean>
{
  const { id: id, ...itemWithoutId } = item;

  const updatedItem = await prisma.inventoryItem.update
  ({
    where: { id },
    data: itemWithoutId
  });
  
  return !!updatedItem;
}
