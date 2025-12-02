"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import FormTagsInput from '@/common/components/inputs/FormTagsInput';
import { Race } from "@/domain/Race";
import { FieldPath } from 'react-hook-form';

type EditSheetProps =
{
  isPending: boolean;
  formId: string;
  displayedTitle: string;
}

export default function RaceEditSheet(input: EditSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent className="w-full">
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{input.displayedTitle}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <div className="grid auto-rows-min gap-3">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>
            <InputFormField<Race> 
              path={'name' as FieldPath<Race>}  
              inputPlaceholder={displayedText.changeName} 
              inputClassName='w-full' 
            />
          </div>

          <div className="grid auto-rows-min gap-3">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>
            <AreaInputFormField<Race> 
              path={'description' as FieldPath<Race>} 
              inputPlaceholder={displayedText.changeDescription} 
              inputClassName='w-full' 
            />
          </div>

          <FormTagsInput<Race> path={'tags' as FieldPath<Race>} />

          <div className="grid auto-rows-min gap-3">
            <Label className='justify-center capitalize'>{displayedText.characteristics}</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.strength}</Label>
                <InputFormField<Race> 
                  path={'strengthModifier' as FieldPath<Race>} 
                  inputClassName='w-20 h-10 text-center font-medium' 
                />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.dexterity}</Label>
                <InputFormField<Race> 
                  path={'dexterityModifier' as FieldPath<Race>} 
                  inputClassName='w-20 h-10 text-center font-medium' 
                />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.constitution}</Label>
                <InputFormField<Race> 
                  path={'constitutionModifier' as FieldPath<Race>} 
                  inputClassName='w-20 h-10 text-center font-medium' 
                />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.mind}</Label>
                <InputFormField<Race> 
                  path={'mindModifier' as FieldPath<Race>} 
                  inputClassName='w-20 h-10 text-center font-medium' 
                />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.charisma}</Label>
                <InputFormField<Race> 
                  path={'charismaModifier' as FieldPath<Race>} 
                  inputClassName='w-20 h-10 text-center font-medium' 
                />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.spellborn}</Label>
                <InputFormField<Race> 
                  path={'spellbornModifier' as FieldPath<Race>} 
                  inputClassName='w-20 h-10 text-center font-medium' 
                />
              </div>
            </div>
          </div>
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
