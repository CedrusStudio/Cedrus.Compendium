"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";
import { InputFormField } from '@/common/components/form/InputFormField';
import { Button } from "@/ui/button"
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { UseFieldArrayRemove } from "react-hook-form";
import { Label } from "@/ui/label";
import { Mode, ModesType, pathToModeField } from "@/domain/characters/combat/Mode";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { displayedText } from "@/presentation/translations";
import { editIcon } from "@/presentation/icons";
import { Separator } from "@/common/components/ui/separator";
import TagsView from "@/common/components/TagsView";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { FormStringsInput } from "@/common/components/inputs/FormStringsInput";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";

type EditModeViewProps =
{ 
  mode: Mode,
  modeType: ModesType; 
  index: number; 
  remove: UseFieldArrayRemove;
}

export default function EditModeView({ mode, modeType, index, remove }: EditModeViewProps)
{ 
  return (
    <div className="flex flex-col m-1 items-center border rounded-md p-2 min-h-24">

      <div className="flex flex-row place-items-center p-2 rounded-md w-full">
        <div className="p-2 rounded-md w-full">
          <h4 className="font-semibold">{mode.name} {mode.grade}</h4>
          <p className="text-sm text-muted-foreground">{mode.description}</p>
        </div>

        <div className="flex flex-row gap-2">
          <RemoveFromArrayButton remove={remove} index={index} />
          <EditModeSheet index={index} modeType={modeType} />
        </div>
      </div>

      <Separator className='mb-2' />
      <TagsView tags={mode.tags} variant="outline" />
    </div>
  );
}

type EditModeSheetProps = 
{
  modeType: ModesType;
  index: number;
};

function EditModeSheet({ index, modeType }: EditModeSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
          <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className="first-letter:uppercase">{displayedText.editingMode}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">
          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className="capitalize">{displayedText.name}</Label>
              <InputFormField<CombatDto> path={pathToModeField(index, modeType, 'name')} inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className="capitalize">{displayedText.grade}</Label>
              <InputFormField<CombatDto> path={pathToModeField(index, modeType, 'grade')} inputPlaceholder={displayedText.changeGrade} inputClassName="w-11 h-10 text-center font-medium" />
            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className="capitalize">{displayedText.description}</Label>
            <AreaInputFormField<CombatDto> path={pathToModeField(index, modeType, 'description')} inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<CombatDto> path={pathToModeField(index, modeType, 'tags')} />
          <FormStringsInput<CombatDto> path={pathToModeField(index, modeType, 'requirements')} placeholder={displayedText.addRequirement} />
        </div>

        <SheetFooter>
          <SheetClose className="capitalize" asChild>
            <Button variant="outline">{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}