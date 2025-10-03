"use client";

import { Defense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FieldView from '@/components/character/FieldView';
import { useState } from 'react';
import FieldViewWithInfo from '@/components/character/FieldViewWithInfo';
import ChangeButtons from '@/components/buttons/ChangeButtons';
import { Label } from '@/components/ui/label';

type DefenseCardProps = 
{
  defense: Defense;
};

type ReductionType = "full" | "block" | "direct";
const allReductionTypes: ReductionType[] = ["full", "block", "direct"];

export default function DefenseCard(input: DefenseCardProps)
{
  const [reductionIncreaseChangeAmount, setReductionIncreaseChangeAmount] = useState<number>(1);
  const [damageTakenChangeAmount, setDamageTakenChangeAmount] = useState<number>(1);
  const [reductionIncrease, setReductionIncrease] = useState<number>(0);
  const [damageTaken, setDamageTaken] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");

  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedReductionType(value as ReductionType);
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Defensywa</CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-y-4 -mt-4'>

        <FieldView name={"niewrażliwość"} value={input.defense.immunity} />
        <FieldView name={"odporność"} value={input.defense.resistance} />

        <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

          <FieldViewWithInfo 
            name={<SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>} 
            value={calculateSelectedReduction(input.defense, selectedReductionType) + reductionIncrease - damageTaken} 
            infoContent={<DefenseInfoContent defense={input.defense} selectedReductionType={selectedReductionType} reductionIncrease={reductionIncrease} damageTaken={damageTaken} />} 
            valueClassName='pr-3'
          />
  
          <SelectContent>
          {
            allReductionTypes.map(reductionType => (
              <SelectItem key={reductionType} value={reductionType}>
                  <span className='capitalize'>{reductionType}</span>
              </SelectItem>
            ))
          }
          </SelectContent>
        </Select>

        <div className='flex gap-4'>
          <Label className='text-sm text-muted-foreground w-36'>Zwiększenie redukcji</Label>
          <ChangeButtons value={reductionIncreaseChangeAmount} setValue={setReductionIncrease} setChangeAmount={setReductionIncreaseChangeAmount} resetValue={0} />
        </div>
        <div className='flex gap-4'>
          <Label className='text-sm text-muted-foreground w-36'>Obrażenia</Label>
          <ChangeButtons value={damageTakenChangeAmount} setValue={setDamageTaken} setChangeAmount={setDamageTakenChangeAmount} resetValue={0} />
        </div>

      </CardContent>
    </Card>
  );
};

function DefenseInfoContent(input: { defense: Defense, selectedReductionType: ReductionType, reductionIncrease: number, damageTaken: number })
{
  return (
    <div>
    {
      <FieldView key="ReductionIncrease" name="Zwiększenie_Redukcji" value={Math.abs(input.reductionIncrease)} valueClassName='text-green-600' />
    }
    {
      <FieldView key="DamageTaken" name="Obrażenia" value={Math.abs(input.damageTaken)} valueClassName='text-red-500' />
    }
    {
      Object.entries(input.defense)
        .filter(([name, _]) => selectFilter(input.selectedReductionType)(name))
        .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
    }
    </div>
  );
}

function calculateSelectedReduction(defense: Defense, selectedReductionType: ReductionType): number 
{
  if (selectedReductionType === "full") 
  {
    return defense.block + defense.parry + defense.dodge + defense.bonus + defense.protection;
  }

  if (selectedReductionType === "block") 
  {
    return defense.block + defense.bonus + defense.protection;
  }

  if (selectedReductionType === "direct") 
  {
    return defense.bonus + defense.protection;
  }

  throw new Error("Invalid reduction type");
}

function selectFilter(selectedReductionType: ReductionType): (name: string) => boolean
{
  if (selectedReductionType === "full") return fullFilter;
  if (selectedReductionType === "block") return blockFilter;
  if (selectedReductionType === "direct") return directFilter;
  throw new Error("Invalid reduction type");
}

function fullFilter(name: string): boolean 
{
  return name !== "immunity" && name !== "resistance";
} 

function blockFilter(name: string): boolean 
{
  return fullFilter(name) && name !== "dodge" && name !== "parry";
} 

function directFilter(name: string): boolean 
{
  return blockFilter(name) && name !== "block";
}