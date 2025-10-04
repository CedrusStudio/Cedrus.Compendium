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
import { castTimeValues, CreateDefaultManeuver, type Maneuver } from "@/domain/Character";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, UseFieldArrayRemove } from "react-hook-form";
import { TbEdit } from "react-icons/tb";
import { Label } from "@/components/ui/label";
import { InputFormField } from '@/components/ui/InputFormField';
import { SelectFormField } from '@/components/ui/SelectFormField';
import AppendToArrayButton from '@/components/ui/AppendToArrayButton';
import RemoveFromArrayButton from '@/components/ui/RemoveFromArrayButton';
import useWatchedFormArray from '@/hooks/useWatchedFormArray';

type EditManeuversCardProps =
{
  control: Control<UpsertCharacterCombatType>;
  isPending: boolean;
}

export default function EditManeuversCard({ control, isPending }: EditManeuversCardProps)
{
  const { append, remove, watchedArray } = useWatchedFormArray("maneuvers", control);

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span>Manewry</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultManeuver} />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
      {
        watchedArray.map((maneuver, index) => (
          <EditManeuverView 
            key={index} 
            maneuver={maneuver} 
            control={control}
            index={index} 
            remove={remove}
          />
        ))
      }
      </CardContent>

    </Card>
  );
};

type EditManeuverViewProps =
{
  maneuver: Maneuver;
  index: number;
  remove: UseFieldArrayRemove;
  control: Control<UpsertCharacterCombatType>;
}

function EditManeuverView({ maneuver, index, remove, control }: EditManeuverViewProps)
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2 min-h-24">
      <div className="p-2 rounded-md w-full">
          <h4 className="font-semibold">{maneuver.name}</h4>
          <p className="text-sm text-muted-foreground">{maneuver.description}</p>
      </div>

      <div className="flex flex-row gap-2">
        <RemoveFromArrayButton remove={remove} index={index} />
        <EditManeuverSheet control={control} index={index} />
      </div>
    </div>
  );
}

type EditManeuverSheetProps = 
{
  index: number;
  control: Control<UpsertCharacterCombatType>;
};

function EditManeuverSheet({ control, index }: EditManeuverSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button"><TbEdit /></Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle>Edit maneuver</SheetTitle>
          <SheetDescription>
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">

              <Label>Name</Label>
              
              <InputFormField<UpsertCharacterCombatType> 
                  name={`maneuvers.${index}.name`}
                  control={control}
                  inputPlaceholder="edit name..." 
                  inputClassName='w-60'
              />

            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">

              <Label>Grade</Label>

              <InputFormField<UpsertCharacterCombatType>
                  name={`maneuvers.${index}.grade`}
                  control={control}
                  inputClassName="w-11 h-10 text-center font-medium" 
              />

            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Description</Label>
            
            <InputFormField<UpsertCharacterCombatType> 
                name={`maneuvers.${index}.description`}
                control={control}
                inputPlaceholder="edit description..." 
                inputClassName='w-80'
            />

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">

              <Label className='justify-center'>Cooldown</Label>

              <InputFormField<UpsertCharacterCombatType>
                  name={`maneuvers.${index}.cooldown`}
                  control={control}
                  inputClassName='w-11 h-10 text-center font-medium'
              />

            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">

              <SelectFormField<UpsertCharacterCombatType>
                name={`maneuvers.${index}.castTime`}
                control={control}
                labelText='Cast Time'
                items={castTimeValues}
              />

            </div>
          </div>

        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type='button'>Close</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}