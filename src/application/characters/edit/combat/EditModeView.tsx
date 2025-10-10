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
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { UseFieldArrayRemove } from "react-hook-form";
import { Label } from "@/ui/label";
import { TbEdit } from "react-icons/tb";
import { Mode, ModesType } from "@/domain/characters/Character";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { translateToSingular } from "@/domain/data/translations";

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
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2  min-h-24">
        
      <div className="p-2 rounded-md w-full">
          <h4 className="font-semibold">{mode.name}</h4>
          <p className="text-sm text-muted-foreground">{mode.description}</p>
      </div>

      <div className="flex flex-row gap-2">
        <RemoveFromArrayButton remove={remove} index={index} />
        <EditModeSheet index={index} modeType={modeType} />
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
          <Button variant="outline" size='icon' type="button"><TbEdit /></Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle>Edytujesz {translateToSingular(modeType)}</SheetTitle>
          <SheetDescription>
            Kliknij zapisz, gdy skończysz.
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">
          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label>Name</Label>
              <InputFormField<UpsertCharacterCombatType> path={`${modeType}.${index}.name`} inputPlaceholder="edit name..." inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label>Grade</Label>
              <InputFormField<UpsertCharacterCombatType> path={`${modeType}.${index}.grade`} inputPlaceholder="edit grade..." inputClassName="w-11 h-10 text-center font-medium" />
            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label>Description</Label>
            <InputFormField<UpsertCharacterCombatType> path={`${modeType}.${index}.description`} inputPlaceholder="edit description..." inputClassName='w-80' />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Zamknij</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}