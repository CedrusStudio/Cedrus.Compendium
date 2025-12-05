"use client";

import { calculateTotalHealth, Health } from '@/domain/characters/combat/Health';
import { Statistic } from '@/domain/characters/statistics/Statistic';
import { Card, CardContent, CardTitle } from '@/ui/card';
import FieldView from '@/common/components/fields/FieldView';
import { Field } from "@/common/components/fields";
import { useState } from 'react';
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { displayedText } from '@/presentation/translations';
import { gainIcon, lossIcon } from '@/presentation/icons';
import { DispatchSetInput, setIf } from '@/common/global/resolveSetState';

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

  function setHealthIncreaseIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setHealthIncrease(value), dispatchInput, healthIncrease);
  }

  function setDamageTakenIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setDamageTaken(value), dispatchInput, damageTaken);
  }

  return (
    <Card className='bg-muted'>
      <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{displayedText.health}</CardTitle>
      <CardContent className='flex flex-col lg:flex-row gap-6 place-content-center h-full gap-y-4'>

        <div className='flex flex-row place-content-center place-items-center'>

          <Field value={totalHealth + healthIncrease - damageTaken} className='gap-x-0' valueClassName='mx-2'>
            <Field.Value />
            <Field.Info>
              <CurrentHealthInfoContent totalHealth={totalHealth} damageTaken={damageTaken} healthIncrease={healthIncrease} />
            </Field.Info>
          </Field>

          <span className='mx-2'>/</span>

          <Field value={totalHealth} className='gap-x-0' valueClassName='mx-2'>
            <Field.Value />
            <Field.Info>
              <HealthInfoContent health={input.health} />
            </Field.Info>
          </Field>
        </div>

        <div className='flex flex-col gap-y-2'>
          <div className='flex gap-4 items-center justify-center'>
            <Label className='text-sm text-muted-foreground'>{gainIcon("size-10")}</Label>
            <ChangeButtons value={healthIncreaseChangeAmount} setValue={setHealthIncreaseIfPositive} setChangeAmount={setHealthIncreaseChangeAmount} resetValue={0} />
          </div>
          <div className='flex gap-4 items-center justify-center'>
            <Label className='text-sm text-muted-foreground'>{lossIcon("size-10")}</Label>
            <ChangeButtons value={damageTakenChangeAmount} setValue={setDamageTakenIfPositive} setChangeAmount={setDamageTakenChangeAmount} resetValue={0} />
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

function HealthInfoContent(input: { health: Health })
{
  return (
    <div className='flex flex-wrap flex-col items-center'>
    {
      Object.entries(input.health)
        .filter(([name]) => name !== 'barrier')
        .map(([name, value]) => <FieldView key={name} value={value} childrenClassName="w-24">{displayedText[name as keyof typeof displayedText]}</FieldView>)
    }
    </div>
  );
};

function CurrentHealthInfoContent(input: { totalHealth: number, damageTaken: number, healthIncrease: number })
{
  return (
    <div className='flex flex-wrap flex-col items-center'>
    { <FieldView key="totalHealth" value={input.totalHealth} childrenClassName="w-24">{displayedText.sum}</FieldView> }
    { <FieldView key="healthIncrease" value={input.healthIncrease} valueClassName='text-green-600' childrenClassName="w-24">{displayedText.increase}</FieldView> }
    { <FieldView key="damageTaken" value={input.damageTaken}  valueClassName='text-red-500' childrenClassName="w-24">{displayedText.damage}</FieldView> }
    </div>
  );
};