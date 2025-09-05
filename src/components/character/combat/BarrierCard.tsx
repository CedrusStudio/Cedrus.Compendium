"use client";

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import FieldView from '@/components/character/FieldView';
import { useState } from 'react';
import { Health } from '@/domain/Character';
import ChangeButtons from '@/components/ChangeButtons';

type BarrierCardProps = 
{
  health: Health;
};

export default function BarrierCard(input: BarrierCardProps)
{
  const [currentBarrier, setCurrentBarrier] = useState<number>(input.health.barrier);
  const [barrierChangeAmount, setBarrierChangeAmount] = useState<number>(1);

  return (
    <Card className='bg-muted'>
        <CardContent className='flex flex-col gap-y-4'>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Barrier</CardTitle>

            <FieldView name="Total" value={input.health.barrier} />
            <FieldView name="Current" value={currentBarrier} />
            
            <ChangeButtons value={barrierChangeAmount} setValue={setCurrentBarrier} setChangeAmount={setBarrierChangeAmount} resetValue={input.health.barrier} />
        </CardContent>
    </Card>
  );
};