"use client";

import SubmitButton from "@/common/components/form/SubmitButton";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { PerkDto } from "@/persistence/schemas/characters/perkSchema";

import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import { PropsWithChildren } from "react";

type PerkableAddSheetProps =
{
  isPending: boolean;
  formId: string;
  title: string;
}

export default function PerkableAddSheet({ isPending, formId, title, children }: PropsWithChildren<PerkableAddSheetProps>)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent className="w-full">
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{title}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col place-content-center place-items-center auto-rows-min gap-3">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<PerkDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<PerkDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<PerkDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<PerkDto> path='tags' />
          <FormStringsInput<PerkDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid auto-rows-min gap-3">
            <Label className='justify-center capitalize'>{displayedText.price}</Label>
            <InputFormField<PerkDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
          </div>

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
