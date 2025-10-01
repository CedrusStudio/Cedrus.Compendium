"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { type Mode } from "@/domain/Character";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, useFieldArray } from "react-hook-form";
import EditModeView from '@/components/character/edit/combat/EditModeView';
import { Button } from '@/components/ui/button';
import { LuPlus } from 'react-icons/lu';

type EditStatesCardProps =
{
    states: Mode[];
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
    combatFormName: string;
}

export default function EditStatesCard({ states, control, isPending, combatFormName }: EditStatesCardProps)
{
  const { fields, append } = useFieldArray
  ({ 
    name: 'states',
    control
  });

  return (
    <Card className='bg-muted'>

      <CardHeader>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
            <span>States</span>
            <Button variant="outline" size="icon" disabled={isPending} onClick={() => { append({ name: `State ${fields.length + 1}`, description: 'New state description', grade: 1 }); }}>
              <LuPlus className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
          states.map((state, index) => <EditModeView key={state.name} modeType='states' mode={state} index={index} control={control} isPending={isPending} combatFormName={combatFormName} />)
      }
      </CardContent>

    </Card>
  );
};
