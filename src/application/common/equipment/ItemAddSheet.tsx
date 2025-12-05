"use client";

import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/common/translations';
import { InventoryItemDto } from "@/persistence/schemas/characters/equipment/itemSchema";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { PropsWithChildren } from "react";
import AddSheet from "@/common/components/sheets/AddSheet";

type ItemAddSheetProps = 
{
  isPending: boolean;
  formId: string;
  title: string;
}

export default function ItemAddSheet({ isPending, formId, title, children }: PropsWithChildren<ItemAddSheetProps>)
{
  return (
    <AddSheet isPending={isPending} formId={formId} title={`${displayedText.add} ${title}`}>
      <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4  place-content-center place-items-center">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<InventoryItemDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4 place-content-center place-items-center">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<InventoryItemDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<InventoryItemDto> path='tags' />

          {children}
      </div>
    </AddSheet>
  )
}
