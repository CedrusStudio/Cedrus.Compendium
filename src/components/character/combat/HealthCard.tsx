"use client";

import { Health, Statistic } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import FieldView from '@/components/character/FieldView';
import FieldViewWithInfoIcon from '@/components/character/FieldViewWithInfoIcon';
import { useState } from 'react';
import ChangeButtons from '@/components/ChangeButtons';
import { BsInfoCircle } from "react-icons/bs";

type HealthCardProps = 
{
  health: Health;
  constitution: Statistic;
  fortitude: Statistic;
};

export default function HealthCard(input: HealthCardProps)
{
  const totalHealth = calculateTotalHealth(input.health, input.constitution, input.fortitude);
  const [currentHealth, setCurrentHealth] = useState<number>(totalHealth);
  const [healthChangeAmount, setHealthChangeAmount] = useState<number>(1);

  return (
    <Card className='bg-muted'>
        <CardContent className='flex flex-col gap-y-4'>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Health</CardTitle>

          <FieldViewWithInfoIcon name="Total" value={totalHealth} infoIcon={<BsInfoCircle />} infoContent={<HealthInfoContent health={input.health} />} />
          <FieldView name="Current" value={currentHealth} />

          <ChangeButtons value={healthChangeAmount} setValue={setCurrentHealth} setChangeAmount={setHealthChangeAmount} resetValue={totalHealth} />
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
        .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
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