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
} from "@/components/ui/sheet";
import { InputFormField } from '@/components/ui/InputFormField';
import { Button } from "@/components/ui/button"
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, UseFieldArrayRemove } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { TbEdit } from "react-icons/tb";
import { Mode, ModesType } from "@/domain/Character";
import RemoveFromArrayButton from "@/components/ui/RemoveFromArrayButton";

type EditModeViewProps =
{ 
  mode: Mode,
  modeType: ModesType; 
  index: number; 
  control: Control<UpsertCharacterCombatType>; 
  remove: UseFieldArrayRemove;
}

export default function EditModeView({ mode, modeType, index, control, remove }: EditModeViewProps)
{ 
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2  min-h-24">
        
        <div className="p-2 rounded-md w-full">
            <h4 className="font-semibold">{mode.name}</h4>
            <p className="text-sm text-muted-foreground">{mode.description}</p>
        </div>

        <div className="flex flex-row gap-2">
          <RemoveFromArrayButton remove={remove} index={index} />
          <EditModeSheet index={index} modeType={modeType} control={control} />
        </div>
    </div>
  );
}

type EditModeSheetProps = 
{
  modeType: ModesType;
  index: number;
  control: Control<UpsertCharacterCombatType>;
};

function EditModeSheet({ index, control, modeType }: EditModeSheetProps)
{
  return (
    <Sheet>

        <SheetTrigger asChild>
            <Button variant="outline" size='icon' type="button"><TbEdit /></Button>
        </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle>Edit mode</SheetTitle>
          <SheetDescription>
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">
          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Name</Label>
                
                <InputFormField<UpsertCharacterCombatType> 
                    name={`${modeType}.${index}.name`}
                    control={control}
                    inputPlaceholder="edit name..." 
                    inputClassName='w-60'
                />

            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Grade</Label>

                <InputFormField<UpsertCharacterCombatType>
                    name={`${modeType}.${index}.grade`}
                    control={control}
                    inputPlaceholder="edit grade..." 
                    inputClassName="w-11 h-10 text-center font-medium" 
                />

            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Description</Label>
            
            <InputFormField<UpsertCharacterCombatType> 
                name={`${modeType}.${index}.description`}
                control={control}
                inputPlaceholder="edit description..." 
                inputClassName='w-80'
            />

          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}