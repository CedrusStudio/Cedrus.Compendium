"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { CreateDefaultStance } from "@/domain/data/defaults";
import { Control } from "react-hook-form";
import EditModeView from '@/components/character/edit/combat/EditModeView';
import AppendToArrayButton from '@/components/ui/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';

type EditStancesCardProps =
{
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
}

export default function EditStancesCard({ control, isPending }: EditStancesCardProps)
{
  const { append, remove, watchedArray } = useWatchedFormArray("stances", control);

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
            control={control} 
            remove={remove} 
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
