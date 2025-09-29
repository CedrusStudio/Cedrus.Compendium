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
import { PropsWithChildren } from 'react';
import { Button } from "@/components/ui/button"
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { TbEdit } from "react-icons/tb";

type EditModeSheetProps = 
{
  modeType: 'stances' | 'states';
  modeNumber: number;
  control: Control<UpsertCharacterCombatType>;
  isPending: boolean;
  combatFormName: string;
};

export default function EditModeSheet({ modeNumber, control, isPending, children, modeType, combatFormName }: PropsWithChildren<EditModeSheetProps>)
{
  return (
      <Sheet>

        <SheetTrigger asChild className='mt-4'>
          <Button variant="outline" type="button"><TbEdit /></Button>
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

            {children}

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