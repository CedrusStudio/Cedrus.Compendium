"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { CreateDefaultState } from "@/domain/data/defaults";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import EditModeView from '@/components/character/edit/combat/EditModeView';
import AppendToArrayButton from '@/components/ui/AppendToArrayButton';
import useWatchedFormArray from '@/hooks/useWatchedFormArray';

type EditStatesCardProps =
{
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
}

export default function EditStatesCard({ control, isPending }: EditStatesCardProps)
{
  const { append, remove, watchedArray } = useWatchedFormArray("states", control);

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span>Stany</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultState} />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        watchedArray.map((state, index) => (
          <EditModeView 
            mode={state}
            key={index} 
            modeType='states' 
            index={index} 
            control={control} 
            remove={remove} 
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
