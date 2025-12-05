"use client";

import { allowedReductionTypes, calculateSelectedReduction, Defense, ReductionType } from '@/domain/characters/combat/Defense';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';

import { useEffect, useState } from 'react';
import { Field } from "@/common/components/fields";
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { displayedText } from '@/presentation/translations';
import SelectOneOf from '@/common/components/selects/SelectOneOf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import DefenseReductionInfoContent from '@/application/characters/combat/DefenseReductionInfoContent';
import FieldWithTooltip from '@/common/components/fields/FieldWithTooltip';
import { gainIcon, immunityIcon, lossIcon, reductionIcons, resistanceIcon } from '@/presentation/icons';
import { DispatchSetInput, setIf } from '@/common/global/resolveSetState';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import ResetButton from '@/common/components/buttons/ResetButton';

type DefenseCardProps = 
{
  defenses: Defense[];
};

export default function DefenseCard({ defenses }: DefenseCardProps)
{
  const [reductionIncreaseChangeAmount, setReductionIncreaseChangeAmount] = useState<number>(1);
  const [damageTakenChangeAmount, setDamageTakenChangeAmount] = useState<number>(1);
  const [reductionIncrease, setReductionIncrease] = useState<number>(0);
  const [damageTaken, setDamageTaken] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");

  const [selectedDefenseIndex, setSelectedDefenseIndex] = useState<number>(0);
  const selectedDefense = defenses[selectedDefenseIndex];
  const [immunity, setImmunity] = useState<number>(selectedDefense.immunity);
  const [resistance, setResistance] = useState<number>(selectedDefense.resistance);

  function setReductionIncreaseIfPositive(setInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setReductionIncrease(value), setInput, reductionIncrease);
  }

  function setDamageTakenIfPositive(setInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, value => setDamageTaken(value), setInput, damageTaken, newValue => Math.max(0, newValue - resistance));
  }

  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedReductionType(value as ReductionType);
  };

  useEffect(() => 
  {
    setImmunity(selectedDefense.immunity);
    setResistance(selectedDefense.resistance);
  }, [selectedDefense]);
  
  return (
    <Card className='bg-muted flex flex-col h-full w-full'>

      <CardHeader className='flex gap-4 items-center justify-center'>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{displayedText.defense}</CardTitle>
        <SelectOneOf name='defense' defaultValue='0' index={selectedDefenseIndex} items={defenses} setIndex={setSelectedDefenseIndex} />
      </CardHeader>

      <CardContent className='flex flex-col flex-1 gap-5 place-items-center place-content-center'>

        <div className='flex flex-col place-content-center place-items-center gap-y-4'>

          <Field value={immunity}>
            <Field.Label className='flex items-center gap-1'>
              <FieldWithTooltip name={displayedText.immunity}>
                <ResetButton asChild variant='ghost' className='h-6 w-6' defaultValuesWithSetters={[[selectedDefense.immunity, setImmunity]]}>
                  {immunityIcon()}
                </ResetButton>
              </FieldWithTooltip>
              <VerticalChangeButtons setValue={setImmunity} />
            </Field.Label>
            <Field.Value />
          </Field>

          <Field value={resistance}>
            <Field.Label className='flex items-center gap-1'>
              <FieldWithTooltip name={displayedText.resistance}>
                <ResetButton asChild variant='ghost' className='h-6 w-6' defaultValuesWithSetters={[[selectedDefense.resistance, setResistance]]}>
                  {resistanceIcon()}
                </ResetButton>
              </FieldWithTooltip>
              <VerticalChangeButtons setValue={setResistance} />
            </Field.Label>
            <Field.Value />
          </Field>

          <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

            <Field value={calculateSelectedReduction(selectedDefense, selectedReductionType) + reductionIncrease - damageTaken}>
              
              <Field.Label>
                <SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>
              </Field.Label>

              <Field.Value />

              <Field.Info>
                <DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} reductionIncrease={reductionIncrease} damageTaken={damageTaken} />
              </Field.Info>
              
            </Field>
    
            <SelectContent>
            {
              allowedReductionTypes.map(reductionType => (
                <SelectItem key={reductionType} value={reductionType}>
                  <span className='capitalize'>{reductionIcons[reductionType]}</span>
                </SelectItem>
              ))
            }
            </SelectContent>
          </Select>

        </div>

        <div className='flex flex-col gap-y-2 place-content-center place-items-center'>
          <div className='flex gap-4 items-center justify-center'>
            <Label className='text-sm text-muted-foreground'>{gainIcon("size-10")}</Label>
            <ChangeButtons value={reductionIncreaseChangeAmount} setValue={setReductionIncreaseIfPositive} setChangeAmount={setReductionIncreaseChangeAmount} resetValue={0} />
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
