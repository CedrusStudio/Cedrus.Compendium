"use client";

import { Health, Statistic } from '@/domain/Character';
import FieldView from '@/components/character/FieldView';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';

type HealthDataCardProps = 
{
  health: Health;
  constitution: Statistic;
  fortitude: Statistic;
};

export default function HealthDataCard(input: HealthDataCardProps)
{
  const totalHealth = calculateTotalHealth(input.health, input.constitution, input.fortitude);
  return (
    <Card className='bg-muted'>

      <CardHeader>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Health</CardTitle>
      </CardHeader>

        <CardContent className='flex flex-col gap-y-4 mt-8'>
        <FieldView key="Total" name="Total" value={totalHealth} />
        <FieldView key="barrier" name="Barrier" value={input.health.barrier} />
        {
            Object.entries(input.health)
                .filter(([name]) => name !== 'barrier')
                .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
        }
        </CardContent>
    </Card>
  );
};


function calculateTotalHealth(health: Health, constitution: Statistic, fortitude: Statistic): number
{
  return health.vitality 
    + health.toughness * constitution.value
    + constitution.testBonus 
    + fortitude.value
    + health.bonus;
}