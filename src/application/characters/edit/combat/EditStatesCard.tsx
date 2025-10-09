"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';

import { CreateDefaultState } from "@/domain/data/defaults";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';

type EditStatesCardProps =
{
  isPending: boolean;
}

export default function EditStatesCard({ isPending }: EditStatesCardProps)
{
  const { control } = useFormContext<UpsertCharacterCombatType>();
  const { remove, watchedArray, append } = useWatchedFormArray("states", control);

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
            remove={remove} 
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
