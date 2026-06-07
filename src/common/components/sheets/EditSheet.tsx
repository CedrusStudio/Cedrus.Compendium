"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from '@/common/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/common/components/ui/sheet";
import { displayedText } from '@/common/translations';
import { editIcon } from '@/common/icons';
import { Activity, PropsWithChildren, ReactNode } from "react";

export interface EditSheetProps 
{
  title: string;
  description?: string;
  isPending: boolean;
  formId: string;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  triggerIcon?: ReactNode;
  triggerSize?: "default" | "sm" | "lg" | "icon";
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
  hasSubmitButton?: boolean;
}

export function EditSheet
(
  {
    title,
    description = displayedText.clickSave,
    isPending,
    formId,
    triggerVariant = "outline",
    triggerIcon = editIcon,
    triggerSize = "icon",
    children,
    onOpenChange,
    contentClassName,
    hasSubmitButton = true
  }
  : PropsWithChildren<EditSheetProps>
) 
{
  return (
    <Sheet onOpenChange={onOpenChange}>

      <SheetTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} type="button">
          {triggerIcon}
        </Button>
      </SheetTrigger>
      
      <SheetContent className={contentClassName || "w-full flex min-h-0 flex-col"}>

        <SheetHeader className="shrink-0">
          <SheetTitle className="first-letter:uppercase">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        
        <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-3 overflow-y-auto overflow-x-hidden px-4 py-4">
          {children}
        </div>
        
        <SheetFooter className="shrink-0">
          
          <Activity mode={hasSubmitButton ? "visible" : "hidden"}>
            <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          </Activity>

          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type="button">
              {displayedText.close}
            </Button>
          </SheetClose>
          
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
