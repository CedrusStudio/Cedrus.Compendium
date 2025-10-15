"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';
import { translate } from '@/presentation/translations';
import { CreateDefaultState } from '@/domain/characters/combat/Mode';

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
          <span>{translate("states")}</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultState} />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        watchedArray.map((state, index) => (
          <EditModeView 
            mode={state}
            key={state.id} 
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
