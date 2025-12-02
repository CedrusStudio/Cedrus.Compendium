"use client";

import SubmitButton from "@/common/components/form/SubmitButton";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { RaceDto } from "@/persistence/schemas/characters/raceSchema";

import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";

type RaceAddSheetProps =
{
  isPending: boolean;
  formId: string;
  title: string;
}

export default function RaceAddSheet({ isPending, formId, title }: RaceAddSheetProps)
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

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<RaceDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-80' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<RaceDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<RaceDto> path='tags' />

          <div className="grid auto-rows-min place-items-center place-content-center gap-3 px-4">
            <div className="grid grid-cols-2 gap-3 place-items-center place-content-center">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.strength}</Label>
                <InputFormField<RaceDto> path='strengthModifier' inputClassName='w-20 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.dexterity}</Label>
                <InputFormField<RaceDto> path='dexterityModifier' inputClassName='w-20 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.constitution}</Label>
                <InputFormField<RaceDto> path='constitutionModifier' inputClassName='w-20 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.mind}</Label>
                <InputFormField<RaceDto> path='mindModifier' inputClassName='w-20 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.charisma}</Label>
                <InputFormField<RaceDto> path='charismaModifier' inputClassName='w-20 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.spellborn}</Label>
                <InputFormField<RaceDto> path='spellbornModifier' inputClassName='w-20 h-10 text-center font-medium' />
              </div>
            </div>
          </div>

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
