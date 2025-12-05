"use client";

import { Card, CardContent, CardTitle } from '@/ui/card';
import { useState } from 'react';
import { Health } from '@/domain/characters/combat/Health';
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { Field } from "@/common/components/fields";
import { displayedText } from '@/presentation/translations';
import { gainIcon, lossIcon } from '@/presentation/icons';
import { DispatchSetInput, setIf } from '@/common/global/resolveSetState';

type BarrierCardProps = 
{
  health: Health;
};

export default function BarrierCard(input: BarrierCardProps)
{
  const [barrierIncrease, setBarrierIncrease] = useState<number>(0);
  const [barrierIncreaseChangeAmount, setBarrierIncreaseChangeAmount] = useState<number>(1);
  const [damageTaken, setDamageTaken] = useState<number>(0);
  const [damageTakenChangeAmount, setDamageTakenChangeAmount] = useState<number>(1);

  function setBarrierIncreaseIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setBarrierIncrease(value), dispatchInput, barrierIncrease);
  }

  function setDamageTakenIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setDamageTaken(value), dispatchInput, damageTaken);
  }

  return (
    <Card className='bg-muted'>
      <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{displayedText.barrier}</CardTitle>
      <CardContent className='flex flex-col lg:flex-row gap-6 place-content-center h-full gap-y-4'>

        <div className='flex flex-row place-content-center place-items-center'>

          <Field value={input.health.barrier + barrierIncrease - damageTaken} className='gap-x-0' valueClassName='mx-2'>
            <Field.Value />
            <Field.Info>
              <CurrentBarrierInfoContent totalBarrier={input.health.barrier} damageTaken={damageTaken} barrierIncrease={barrierIncrease} />
            </Field.Info>
          </Field>

          <span className='mx-2'>/</span>
          
          <Field value={input.health.barrier} className='gap-x-0'>
            <Field.Value />
          </Field>

        </div>

        <div className='flex flex-col gap-y-2'>
          <div className='flex gap-4 items-center justify-center'>
            <Label className='text-sm text-muted-foreground'>{gainIcon("size-10")}</Label>
            <ChangeButtons value={barrierIncreaseChangeAmount} setValue={setBarrierIncreaseIfPositive} setChangeAmount={setBarrierIncreaseChangeAmount} resetValue={0} />
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

function CurrentBarrierInfoContent(input: { totalBarrier: number, damageTaken: number, barrierIncrease: number })
{
  return (
    <div className='flex flex-wrap flex-col place-content-center place-items-start'>

      <Field key="totalBarrier" value={input.totalBarrier}>
        <Field.Label className="w-24">{displayedText.sum}</Field.Label>
        <Field.Value />
      </Field>
      
      <Field key="barrierIncrease" value={input.barrierIncrease} valueClassName='text-green-600'>
        <Field.Label className="w-24">{displayedText.increase}</Field.Label>
        <Field.Value />
      </Field>
    
      <Field key="damageTaken" value={input.damageTaken} valueClassName='text-red-500'>
        <Field.Label className="w-24">{displayedText.damage}</Field.Label>
        <Field.Value />
      </Field>
      
    </div>
  );
}