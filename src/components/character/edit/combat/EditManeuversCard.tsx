"use client";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { type Maneuver } from "@/domain/Character";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { TbEdit } from "react-icons/tb";

type EditManeuversCardProps =
{
    maneuvers: Maneuver[];
    control: Control<UpsertCharacterCombatType>;
    isPending: boolean;
    combatFormName: string;
}

export default function EditManeuversCard({ maneuvers, control, isPending, combatFormName }: EditManeuversCardProps)
{
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Maneuvers</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
        {
            maneuvers.map(maneuver => <EditManeuverView key={maneuver.name} maneuver={maneuver} />)
        }
        </CardContent>

    </Card>
  );
};

function EditManeuverView({ maneuver }: { maneuver: Maneuver })
{
    return (
        <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2">
            
            <div className="p-4 rounded-md w-full">
                <h4 className="font-semibold">{maneuver.name}</h4>
                <p className="text-sm text-muted-foreground">{maneuver.description}</p>
            </div>

            <Button variant="outline" size="icon" type='button'>
                <TbEdit />
            </Button>
        </div>
    );
}