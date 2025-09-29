"use client";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { castTimeValues, type Maneuver } from "@/domain/Character";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { TbEdit } from "react-icons/tb";
import { Label } from "@/components/ui/label";
import { InputFormField } from '@/components/ui/InputFormField';
import SubmitButton from '@/components/ui/SubmitButton';
import { SelectFormField } from '@/components/ui/SelectFormField';

type EditManeuversCardProps =
{
    maneuvers: Maneuver[];
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
    combatFormName: string;
}

export default function EditManeuversCard({ maneuvers, control, isPending, combatFormName }: EditManeuversCardProps)
{
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Maneuvers</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
        {
            maneuvers.map((maneuver, index) => <EditManeuverView key={maneuver.name} maneuver={maneuver} index={index} control={control} isPending={isPending} combatFormName={combatFormName} />)
        }
        </CardContent>

    </Card>
  );
};

type EditManeuverViewProps =
{
  maneuver: Maneuver;
  index: number;
  control: Control<UpsertCharacterCombatType>;
  isPending: boolean;
  combatFormName: string;
}

function EditManeuverView({ maneuver, index, control, isPending, combatFormName }: EditManeuverViewProps)
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2">
        
        <div className="p-2 rounded-md w-full">
            <h4 className="font-semibold">{maneuver.name}</h4>
            <p className="text-sm text-muted-foreground">{maneuver.description}</p>
        </div>

        <div className="-mt-3">
          <EditManeuverSheet maneuverNumber={index} control={control} isPending={isPending} combatFormName={combatFormName} />
        </div>
    </div>
  );
}

type EditManeuverSheetProps = 
{
  maneuverNumber: number;
  control: Control<UpsertCharacterCombatType>;
  isPending: boolean;
  combatFormName: string;
};

function EditManeuverSheet({ maneuverNumber, control, isPending, combatFormName }: EditManeuverSheetProps)
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
                    name={`maneuvers.${maneuverNumber}.name`}
                    control={control}
                    inputPlaceholder="edit name..." 
                    inputClassName='w-60'
                />

            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Grade</Label>

                <InputFormField<UpsertCharacterCombatType>
                    name={`maneuvers.${maneuverNumber}.grade`}
                    control={control}
                    inputClassName="w-11 h-10 text-center font-medium" 
                />

            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">

              <Label>Description</Label>
              
              <InputFormField<UpsertCharacterCombatType> 
                  name={`maneuvers.${maneuverNumber}.description`}
                  control={control}
                  inputPlaceholder="edit description..." 
                  inputClassName='w-80'
              />

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className='justify-center'>Cooldown</Label>

                <InputFormField<UpsertCharacterCombatType>
                    name={`maneuvers.${maneuverNumber}.cooldown`}
                    control={control}
                    inputClassName='w-11 h-10 text-center font-medium'
                />

            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">

                <SelectFormField<UpsertCharacterCombatType>
                    name={`maneuvers.${maneuverNumber}.castTime`}
                    control={control}
                    labelText='Cast Time'
                    items={castTimeValues}
                />

            </div>
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