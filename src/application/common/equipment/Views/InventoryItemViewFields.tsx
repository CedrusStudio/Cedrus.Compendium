"use client";

import SummaryView from "@/application/common/SummaryView";
import { type Item } from '@/domain/characters/equipment/Item';

type InventoryItemViewFieldsProps =
{
  item: Item;
}

export default function InventoryItemViewFields({ item }: InventoryItemViewFieldsProps)
{
  return (
    <div className='flex flex-row place-items-center w-full'>
      <SummaryView entity={item} />
    </div>
  );
}
