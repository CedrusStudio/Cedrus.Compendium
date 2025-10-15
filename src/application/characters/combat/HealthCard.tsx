"use client";

import { calculateTotalHealth, Health } from '@/domain/characters/combat/Health';
import { Statistic } from '@/domain/characters/statistics/Statistic';

import {
  Card,
  CardContent,
  CardTitle,
} from '@/ui/card';
import FieldView from '@/common/components/fields/FieldView';
import FieldViewWithInfo from '@/common/components/fields/FieldViewWithInfo';
import { useState } from 'react';
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { translate } from '@/presentation/translations';
import { displayedText } from '@/presentation/translations';
import FieldWithTooltip from '@/common/components/fields/FieldWithTooltip';
import { currentValueIcon, sumIcon } from '@/presentation/icons';
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
      <CardContent className='flex flex-col h-full gap-y-4'>

        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{translate("health")}</CardTitle>

        <FieldViewWithInfo value={totalHealth} infoContent={<HealthInfoContent health={input.health} />} >
          <FieldWithTooltip name={translate("sum")}>{sumIcon}</FieldWithTooltip>
        </FieldViewWithInfo>

        <FieldViewWithInfo 
          value={totalHealth + healthIncrease - damageTaken} 
          infoContent={<CurrentHealthInfoContent totalHealth={totalHealth} damageTaken={damageTaken} healthIncrease={healthIncrease} />} 
        >
          <FieldWithTooltip name={displayedText.current}>{currentValueIcon}</FieldWithTooltip>
        </FieldViewWithInfo>

        <div className='flex-1 flex flex-col justify-end gap-y-2 mt-2'>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{displayedText.increase}</Label>
            <ChangeButtons value={healthIncreaseChangeAmount} setValue={setHealthIncreaseIfPositive} setChangeAmount={setHealthIncreaseChangeAmount} resetValue={0} />
          </div>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{displayedText.damage}</Label>
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
        .map(([name, value]) => <FieldView key={name} value={value} childrenClassName="w-24">{translate(name)}</FieldView>)
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