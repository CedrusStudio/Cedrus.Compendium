"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { InventoryItemDto } from "@/persistence/schemas/characters/equipment/itemSchema";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { PropsWithChildren } from "react";

type ItemAddSheetProps = 
{
  isPending: boolean;
  formId: string;
  title: string;
}

export default function ItemAddSheet({ isPending, formId, title, children }: PropsWithChildren<ItemAddSheetProps>)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent className="w-full">
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.add} {title}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

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

        <SheetFooter>
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
