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
import EditModeSheet from '@/components/character/edit/combat/EditModeSheet';

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
        stances.map((stance, index) => <EditStanceView key={stance.name} stance={stance} index={index} control={control} isPending={isPending} combatFormName={combatFormName} />)
      }
      </CardContent>

    </Card>
  );
};

function EditStanceView({ stance, index, control, isPending, combatFormName }: { stance: Mode; index: number; control: Control<UpsertCharacterCombatType>; isPending: boolean; combatFormName: string })
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2">
        <div className="p-4 rounded-md w-full">
            <h4 className="font-semibold">{stance.name}</h4>
            <p className="text-sm text-muted-foreground">{stance.description}</p>
        </div>

        <EditModeSheet modeNumber={index} modeType="stances" control={control} isPending={isPending} combatFormName={combatFormName} />
    </div>
  );
}