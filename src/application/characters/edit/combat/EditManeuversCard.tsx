"use client";

import { Button } from '@/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
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
import { CreateDefaultManeuver, type Maneuver, allowedCastTimes } from "@/domain/characters/combat/Maneuver";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { UseFieldArrayRemove, useFormContext } from "react-hook-form";
import { TbEdit } from "react-icons/tb";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { displayedText } from '@/presentation/translations';

type EditManeuversCardProps =
{
  isPending: boolean;
}

export default function EditManeuversCard({ isPending }: EditManeuversCardProps)
{
  const { control } = useFormContext<UpsertCharacterCombatType>();
  const { remove, watchedArray, append } = useWatchedFormArray("maneuvers", control);

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span className='capitalize'>{displayedText.maneuvers}</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultManeuver} />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
      {
        watchedArray.map((maneuver, index) => <EditManeuverView key={maneuver.id} maneuver={maneuver} index={index} remove={remove} />)
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
}

function EditManeuverView({ maneuver, index, remove }: EditManeuverViewProps)
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2 min-h-24">
      <div className="p-2 rounded-md w-full">
          <h4 className="font-semibold">{maneuver.name}</h4>
          <p className="text-sm text-muted-foreground">{maneuver.description}</p>
      </div>

      <div className="flex flex-row gap-2">
        <RemoveFromArrayButton remove={remove} index={index} />
        <EditManeuverSheet index={index} />
      </div>
    </div>
  );
}

type EditManeuverSheetProps = 
{
  index: number;
};

function EditManeuverSheet({ index }: EditManeuverSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button"><TbEdit /></Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle>{displayedText.editManeuver}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<UpsertCharacterCombatType> path={`maneuvers.${index}.name`} inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<UpsertCharacterCombatType> path={`maneuvers.${index}.grade`} inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<UpsertCharacterCombatType> path={`maneuvers.${index}.description`} inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center'>{displayedText.cooldown}</Label>
              <InputFormField<UpsertCharacterCombatType> path={`maneuvers.${index}.cooldown`} inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <SelectFormField<UpsertCharacterCombatType> path={`maneuvers.${index}.castTime`} labelText={displayedText.castTime} items={allowedCastTimes} />
            </div>
          </div>

        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}