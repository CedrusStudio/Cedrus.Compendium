"use client";

import {
  Card,
  CardContent,
  CardTitle,
} from '@/ui/card';
import FieldView from '@/common/components/fields/FieldView';
import { useState } from 'react';
import { Health } from '@/domain/characters/combat/Health';
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import FieldViewWithInfo from '@/common/components/fields/FieldViewWithInfo';
import { namingConventions } from '@/presentation/translations';
import FieldWithTooltip from '@/common/components/fields/FieldWithTooltip';
import { currentValueIcon, sumIcon } from '@/presentation/icons';
import { translate } from '@/presentation/translations';
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
      <CardContent className='flex flex-col h-full gap-y-4'>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{translate("barrier")}</CardTitle>

        <FieldView value={input.health.barrier}>
          <FieldWithTooltip name={translate("sum")}>{sumIcon}</FieldWithTooltip>
        </FieldView>

        <FieldViewWithInfo 
          value={input.health.barrier + barrierIncrease - damageTaken} 
          infoContent={<CurrentBarrierInfoContent totalBarrier={input.health.barrier} damageTaken={damageTaken} barrierIncrease={barrierIncrease} />} 
        >
          <FieldWithTooltip name={namingConventions.current}>{currentValueIcon}</FieldWithTooltip>
        </FieldViewWithInfo>

        <div className='flex-1 flex flex-col justify-end gap-y-2 mt-2'>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{namingConventions.increase}</Label>
            <ChangeButtons value={barrierIncreaseChangeAmount} setValue={setBarrierIncreaseIfPositive} setChangeAmount={setBarrierIncreaseChangeAmount} resetValue={0} />
          </div>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{namingConventions.damage}</Label>
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
    <div className='flex flex-wrap flex-col items-center'>
    { <FieldView key="totalBarrier" value={input.totalBarrier} childrenClassName="w-24">{translate("sum")}</FieldView> }
    { <FieldView key="barrierIncrease" value={input.barrierIncrease} valueClassName='text-green-600' childrenClassName="w-24">{namingConventions.increase}</FieldView> }
    { <FieldView key="damageTaken" value={input.damageTaken}  valueClassName='text-red-500' childrenClassName="w-24">{namingConventions.damage}</FieldView> }
    </div>
  );
}