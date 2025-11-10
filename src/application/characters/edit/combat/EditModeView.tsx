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
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { FormStringsInput } from "@/common/components/inputs/FormStringsInput";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import SummaryView from "@/application/common/SummaryView";

type EditModeViewProps =
{ 
  mode: Mode,
  modeType: ModesType; 
  index: number; 
  remove: UseFieldArrayRemove;
  isImported: boolean;
}

export default function EditModeView({ mode, modeType, index, remove, isImported }: EditModeViewProps)
{ 
  return (
    <div className="flex flex-row gap-2 m-1 items-center border rounded-md p-2 min-h-24">

      <SummaryView entity={mode} tagsVariant="outline" />
      <ImportedBadge isImported={isImported} />

      <div className="flex flex-row gap-2">
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditModeSheet index={index} modeType={modeType} />}
      </div>

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