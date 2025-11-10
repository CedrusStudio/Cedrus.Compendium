"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { PropsWithChildren } from "react";
import PerkEditableFields from "@/application/common/PerkEditableFields";

type EditSheetProps =
{
  isPending: boolean;
  formId: string;
  displayedTitle: string;
}

export function PerkableEditSheet(input: PropsWithChildren<EditSheetProps>)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{input.displayedTitle}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <PerkEditableFields />
          {input.children}
        </div>

        <SheetFooter>
          <SubmitButton isPending={input.isPending} className="w-full" formName={input.formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}