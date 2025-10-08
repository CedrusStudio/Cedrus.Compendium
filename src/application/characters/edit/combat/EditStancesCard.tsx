"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { CreateDefaultStance } from "@/domain/data/defaults";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/ui/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';

type EditStancesCardProps =
{
    isPending: boolean;
}

export default function EditStancesCard({ isPending }: EditStancesCardProps)
{
  const { control } = useFormContext<UpsertCharacterCombatType>();
  const { remove, watchedArray, append } = useWatchedFormArray("stances", control);

  return (
    <Card className='bg-muted'>

      <CardHeader>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
            <span>Postawy</span>
            <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultStance} />
          </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        watchedArray.map((stance, index) => (
          <EditModeView 
            mode={stance}
            key={index} 
            modeType='stances' 
            index={index} 
            remove={remove} 
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
