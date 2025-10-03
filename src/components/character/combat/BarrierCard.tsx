"use client";

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import FieldView from '@/components/character/FieldView';
import { useState } from 'react';
import { Health } from '@/domain/Character';
import ChangeButtons from '@/components/buttons/ChangeButtons';
import { Label } from '@/components/ui/label';
import FieldViewWithInfo from '../FieldViewWithInfo';

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

  return (
    <Card className='bg-muted'>
        <CardContent className='flex flex-col gap-y-4'>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Bariera</CardTitle>

            <FieldView name="Suma" value={input.health.barrier} />
            <FieldViewWithInfo name="Obecna" value={input.health.barrier + barrierIncrease - damageTaken} infoContent={<CurrentBarrierInfoContent totalBarrier={input.health.barrier} damageTaken={damageTaken} barrierIncrease={barrierIncrease} />} />

            <div className='flex gap-4'>
              <Label className='text-sm text-muted-foreground w-36'>Zwiększenie bariery</Label>
              <ChangeButtons value={barrierIncreaseChangeAmount} setValue={setBarrierIncrease} setChangeAmount={setBarrierIncreaseChangeAmount} resetValue={0} />
            </div>
            <div className='flex gap-4'>
              <Label className='text-sm text-muted-foreground w-36'>Obrażenia</Label>
              <ChangeButtons value={damageTakenChangeAmount} setValue={setDamageTaken} setChangeAmount={setDamageTakenChangeAmount} resetValue={0} />
            </div>

        </CardContent>
    </Card>
  );
};

function CurrentBarrierInfoContent(input: { totalBarrier: number, damageTaken: number, barrierIncrease: number })
{
  return (
    <div>
    {
      <FieldView key="totalBarrier" name="Suma" value={input.totalBarrier} />
    }
    {
      <FieldView key="barrierIncrease" name="Zwiększenie_Bariery" value={input.barrierIncrease} valueClassName='text-green-600' />
    }
    {
      <FieldView key="damageTaken" name="Obrażenia" value={input.damageTaken}  valueClassName='text-red-500' />
    }
    </div>
  );
}