"use client";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { TbEdit } from "react-icons/tb";
import { type Mode } from "@/domain/Character";
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";

type EditStatesCardProps =
{
    states: Mode[];
    control: Control<UpsertCharacterCombatType>;
}

export default function EditStatesCard({ states, control }: EditStatesCardProps)
{
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>States</CardTitle>
        </CardHeader>

        <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
        {
            states.map(state => <EditStateView key={state.name} state={state} />)
        }
        </CardContent>

    </Card>
  );
};

function EditStateView({ state }: { state: Mode })
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2">
        
        <div className="p-4 rounded-md w-full">
            <h4 className="font-semibold">{state.name}</h4>
            <p className="text-sm text-muted-foreground">{state.description}</p>
        </div>

        <Button variant="outline" size="icon" type='button'>
            <TbEdit />
        </Button>
    </div>
  );
}