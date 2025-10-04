"use client";

import { Health, Statistic } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import FieldView from '@/components/global/fields/FieldView';
import FieldViewWithInfo from '@/components/global/fields/FieldViewWithInfo';
import { useState } from 'react';
import ChangeButtons from '@/components/global/buttons/ChangeButtons';
import { Label } from '@/components/ui/label';
import { translate } from '@/domain/data/translations';
import { namingConventions } from '@/domain/data/namingConventions';

type HealthCardProps = 
{
  health: Health;
  constitution: Statistic;
  fortitude: Statistic;
};

export default function HealthCard(input: HealthCardProps)
{
  const totalHealth = calculateTotalHealth(input.health, input.constitution, input.fortitude);
  const [healthIncrease, setHealthIncrease] = useState<number>(0);
  const [healthIncreaseChangeAmount, setHealthIncreaseChangeAmount] = useState<number>(1);
  const [damageTaken, setDamageTaken] = useState<number>(0);
  const [damageTakenChangeAmount, setDamageTakenChangeAmount] = useState<number>(1);

  return (
    <Card className='bg-muted'>
      <CardContent className='flex flex-col h-full gap-y-4'>

        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Życie</CardTitle>

        <FieldViewWithInfo name={namingConventions.sum} value={totalHealth} infoContent={<HealthInfoContent health={input.health} />} />
        <FieldViewWithInfo name={namingConventions.current} value={totalHealth + healthIncrease - damageTaken} infoContent={<CurrentHealthInfoContent totalHealth={totalHealth} damageTaken={damageTaken} healthIncrease={healthIncrease} />} />

        <div className='flex-1 flex flex-col justify-end gap-y-2 mt-2'>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{namingConventions.increase}</Label>
            <ChangeButtons value={healthIncreaseChangeAmount} setValue={setHealthIncrease} setChangeAmount={setHealthIncreaseChangeAmount} resetValue={0} />
          </div>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{namingConventions.damage}</Label>
            <ChangeButtons value={damageTakenChangeAmount} setValue={setDamageTaken} setChangeAmount={setDamageTakenChangeAmount} resetValue={0} />
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

function HealthInfoContent(input: { health: Health })
{
  return (
    <div>
    {
      Object.entries(input.health)
        .filter(([name]) => name !== 'barrier')
        .map(([name, value]) => <FieldView key={name} name={translate(name)} value={value} />)
    }
    </div>
  );
};

function CurrentHealthInfoContent(input: { totalHealth: number, damageTaken: number, healthIncrease: number })
{
  return (
    <div>
    {
      <FieldView key="totalHealth" name={namingConventions.sum} value={input.totalHealth} />
    }
    {
      <FieldView key="healthIncrease" name={namingConventions.increase} value={input.healthIncrease} valueClassName='text-green-600' />
    }
    {
      <FieldView key="damageTaken" name={namingConventions.damage} value={input.damageTaken}  valueClassName='text-red-500' />
    }
    </div>
  );
}

function calculateTotalHealth(health: Health, constitution: Statistic, fortitude: Statistic): number
{
  return health.vitality 
    + health.toughness * constitution.value
    + constitution.testBonus 
    + fortitude.value
    + health.bonus;
}