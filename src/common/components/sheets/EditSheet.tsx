"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from '@/common/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/common/components/ui/sheet";
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { PropsWithChildren, ReactNode } from "react";

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
      
      <SheetContent className={contentClassName || "w-full"}>

        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col gap-3 px-4 place-items-center place-content-center">
          {children}
        </div>
        
        <SheetFooter>
          
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />

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
