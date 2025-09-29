"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { type Mode } from "@/domain/Character";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import EditModeView from '@/components/character/edit/combat/EditModeView';

type EditStatesCardProps =
{
    states: Mode[];
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
    combatFormName: string;
}

export default function EditStatesCard({ states, control, isPending, combatFormName }: EditStatesCardProps)
{
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>States</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
        {
            states.map((state, index) => <EditModeView key={state.name} modeType='states' mode={state} index={index} control={control} isPending={isPending} combatFormName={combatFormName} />)
        }
        </CardContent>

    </Card>
  );
};
