"use client";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Button } from "@/ui/button";
import { addIcon } from "@/common/icons";
import { displayedText } from "@/common/translations";
import SubmitButton from "@/common/components/form/SubmitButton";
import { PropsWithChildren, ReactNode } from "react";

type AddSheetProps = PropsWithChildren<
{
  isPending: boolean;
  formId: string;
  title: string;
  triggerIcon?: ReactNode;
  triggerLabel?: string;
}>;

export default function AddSheet
(
  { 
    isPending, 
    formId, 
    title, 
    triggerIcon = addIcon(),
    triggerLabel,
    children 
  }
  : AddSheetProps
)
{
  return (
    <Sheet>
      <SheetTrigger asChild>
        {
          triggerLabel ? (
              <Button variant="outline" type="button">
                {triggerIcon}
                <span className="first-letter:uppercase">{triggerLabel}</span>
              </Button>
            ) : (
              <Button variant="outline" size="icon" type="button" aria-label={title}>
                {triggerIcon}
              </Button>
            )
        }
      </SheetTrigger>

      <SheetContent className="w-full flex min-h-0 flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className='first-letter:uppercase'>{title}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-3 overflow-y-auto overflow-x-hidden px-4 py-4">
          {children}
        </div>

        <SheetFooter className="shrink-0">
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
