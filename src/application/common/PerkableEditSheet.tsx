"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import { PropsWithChildren } from "react";
import { FieldValues, FieldPath } from "react-hook-form";
import { Perk } from "@/domain/characters/Perk";

type EditSheetProps =
{
  isPending: boolean;
  formId: string;
  displayedTitle: string;
}

export function PerkableEditSheet<TDto extends Omit<Perk, "id"> & FieldValues>(input: PropsWithChildren<EditSheetProps>)
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

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">

              <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>
              <InputFormField<TDto> path={'name' as FieldPath<TDto>}  inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.grade}</span></Label>
              <InputFormField<TDto> path={'grade' as FieldPath<TDto>} inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>
            <AreaInputFormField<TDto> path={'description' as FieldPath<TDto>} inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<TDto> path={'tags' as FieldPath<TDto>} />
          <FormStringsInput<TDto> path={'requirements' as FieldPath<TDto>} placeholder={displayedText.addRequirement} />
          
          <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.price}</span></Label>
            <InputFormField<TDto> path={'price' as FieldPath<TDto>} inputClassName='w-11 h-10 text-center font-medium'  />
          </div>

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