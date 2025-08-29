"use client";

import { Defense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import FieldView from '@/components/character/FieldView';

type DefenseCardProps = 
{
  defense: Defense;
};

export default function DefenseDataCard({ defense}: DefenseCardProps)
{
  return (
    <Card className='bg-muted'>

        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Defense</CardTitle>
        </CardHeader>

        <CardContent className='flex flex-col gap-y-4'>
            <FieldView key="immunity" name="Immunity" value={defense.immunity} />
            <FieldView key="resistance" name="Resistance" value={defense.resistance} />
            <FieldView key="total" name="Total" value={calculateFullReduction(defense)} />
            <FieldView key="block" name="Block" value={calculateBlockReduction(defense)} />
            <FieldView key="direct" name="Direct" value={calculateDirectReduction(defense)} />
            {
                Object.entries(defense)
                    .filter(([name, _]) => name !== "immunity" && name !== "resistance")
                    .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
            }
        </CardContent>
      
    </Card>
  );
};

function calculateFullReduction(defense: Defense): number 
{
    return defense.block + defense.parry + defense.dodge + defense.bonus + defense.protection;
}

function calculateBlockReduction(defense: Defense): number 
{
    return defense.bonus + defense.protection;
}

function calculateDirectReduction(defense: Defense): number 
{
    return defense.bonus + defense.protection;
}