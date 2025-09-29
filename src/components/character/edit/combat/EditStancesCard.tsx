"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { type Mode } from "@/domain/Character";
import { Control } from "react-hook-form";
import EditModeView from '@/components/character/edit/combat/EditModeView';

type EditStancesCardProps =
{
    stances: Mode[];
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
    combatFormName: string;
}

export default function EditStancesCard({ stances, control, isPending, combatFormName }: EditStancesCardProps)
{
  return (
    <Card className='bg-muted'>

      <CardHeader>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Stances</CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        stances.map((stance, index) => <EditModeView key={stance.name} modeType='stances' mode={stance} index={index} control={control} isPending={isPending} combatFormName={combatFormName} />)
      }
      </CardContent>

    </Card>
  );
};