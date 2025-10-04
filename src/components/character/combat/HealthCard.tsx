"use client";

import { Health, Statistic } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import FieldView from '@/components/character/FieldView';
import FieldViewWithInfo from '@/components/character/FieldViewWithInfo';
import { useState } from 'react';
import ChangeButtons from '@/components/buttons/ChangeButtons';
import { Label } from '@/components/ui/label';
import { translate } from '@/domain/translations';

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
      <CardContent className='flex flex-col gap-y-4'>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Życie</CardTitle>

          <FieldViewWithInfo name="Suma" value={totalHealth} infoContent={<HealthInfoContent health={input.health} />} />
          <FieldViewWithInfo name="Obecne" value={totalHealth + healthIncrease - damageTaken} infoContent={<CurrentHealthInfoContent totalHealth={totalHealth} damageTaken={damageTaken} healthIncrease={healthIncrease} />} />

          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>Przyrost</Label>
            <ChangeButtons value={healthIncreaseChangeAmount} setValue={setHealthIncrease} setChangeAmount={setHealthIncreaseChangeAmount} resetValue={0} />
          </div>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>Obrażenia</Label>
            <ChangeButtons value={damageTakenChangeAmount} setValue={setDamageTaken} setChangeAmount={setDamageTakenChangeAmount} resetValue={0} />
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
      <FieldView key="totalHealth" name="Suma" value={input.totalHealth} />
    }
    {
      <FieldView key="healthIncrease" name="Przyrost" value={input.healthIncrease} valueClassName='text-green-600' />
    }
    {
      <FieldView key="damageTaken" name="Obrażenia" value={input.damageTaken}  valueClassName='text-red-500' />
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