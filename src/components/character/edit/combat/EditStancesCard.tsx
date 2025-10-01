"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { type Mode } from "@/domain/Character";
import { Control, useFieldArray } from "react-hook-form";
import EditModeView from '@/components/character/edit/combat/EditModeView';
import { LuPlus } from 'react-icons/lu';
import { Button } from '@/components/ui/button';

type EditStancesCardProps =
{
    stances: Mode[];
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
    combatFormName: string;
}

export default function EditStancesCard({ stances, control, isPending, combatFormName }: EditStancesCardProps)
{
  const { fields, append } = useFieldArray
  ({ 
    name: 'stances',
    control
  });

  return (
    <Card className='bg-muted'>

      <CardHeader>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
            <span>Stances</span>
            <Button variant="outline" size="icon" disabled={isPending} onClick={() => { append({ name: `Stance ${fields.length + 1}`, description: 'New stance description', grade: 1 }); }}>
              <LuPlus className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        stances.map((stance, index) => <EditModeView key={stance.name} modeType='stances' mode={stance} index={index} control={control} isPending={isPending} combatFormName={combatFormName} />)
      }
      </CardContent>

    </Card>
  );
};
