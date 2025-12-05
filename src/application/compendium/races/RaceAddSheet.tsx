"use client";

import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { RaceDto } from "@/persistence/schemas/characters/raceSchema";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import AddSheet from "@/common/components/sheets/AddSheet";

type RaceAddSheetProps =
{
  isPending: boolean;
  formId: string;
  title: string;
}

export default function RaceAddSheet({ isPending, formId, title }: RaceAddSheetProps)
{
  return (
    <AddSheet isPending={isPending} formId={formId} title={title}>

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
    </AddSheet>
  )
}
