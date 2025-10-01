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
import SubmitButton from '@/components/ui/SubmitButton';
import { InputFormField } from '@/components/ui/InputFormField';
import { Button } from "@/components/ui/button"
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { TbEdit } from "react-icons/tb";
import { Mode, ModesType } from "@/domain/Character";
import { IoTrashOutline } from "react-icons/io5";

type EditModeViewProps =
{ 
  modeType: ModesType; 
  mode: Mode; 
  index: number; 
  control: Control<UpsertCharacterCombatType>; 
  isPending: boolean; 
  combatFormName: string;
}

export default function EditModeView({ modeType, mode, index, control, isPending, combatFormName }: EditModeViewProps)
{  
  const { remove } = useFieldArray
  ({ 
    name: modeType,
    control
  });

  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2  min-h-24">
        
        <div className="p-2 rounded-md w-full">
            <h4 className="font-semibold">{mode.name}</h4>
            <p className="text-sm text-muted-foreground">{mode.description}</p>
        </div>

        <div className="flex flex-row gap-2">
          <Button variant="destructive" size='icon' onClick={() => remove(index)}><IoTrashOutline /></Button>
          <EditModeSheet modeNumber={index} modeType={modeType} control={control} isPending={isPending} combatFormName={combatFormName} />
        </div>
    </div>
  );
}

type EditModeSheetProps = 
{
  modeType: ModesType;
  modeNumber: number;
  control: Control<UpsertCharacterCombatType>;
  isPending: boolean;
  combatFormName: string;
};

function EditModeSheet({ modeNumber, control, isPending, modeType, combatFormName }: EditModeSheetProps)
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
                    name={`${modeType}.${modeNumber}.name`}
                    control={control}
                    inputPlaceholder="edit name..." 
                    inputClassName='w-60'
                />

            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Grade</Label>

                <InputFormField<UpsertCharacterCombatType>
                    name={`${modeType}.${modeNumber}.grade`}
                    control={control}
                    inputPlaceholder="edit grade..." 
                    inputClassName="w-11 h-10 text-center font-medium" 
                />

            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">

              <Label>Description</Label>
              
              <InputFormField<UpsertCharacterCombatType> 
                  name={`${modeType}.${modeNumber}.description`}
                  control={control}
                  inputPlaceholder="edit description..." 
                  inputClassName='w-80'
              />

          </div>
        </div>

        <SheetFooter>
          <SubmitButton isPending={isPending} className='w-full' formName={combatFormName} />
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}