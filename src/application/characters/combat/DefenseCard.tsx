"use client";

import { Defense } from '@/domain/characters/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';

import FieldView from "@/common/components/fields/FieldView";
import { useState } from 'react';
import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { translateReductions } from '@/domain/data/translations';
import { namingConventions } from '@/domain/data/namingConventions';
import SelectOneOf from '@/common/components/selects/SelectOneOf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type DefenseCardProps = 
{
  defenses: Defense[];
};

type ReductionType = "full" | "block" | "direct";
const allReductionTypes: ReductionType[] = ["full", "block", "direct"];

export default function DefenseCard({ defenses }: DefenseCardProps)
{
  const [reductionIncreaseChangeAmount, setReductionIncreaseChangeAmount] = useState<number>(1);
  const [damageTakenChangeAmount, setDamageTakenChangeAmount] = useState<number>(1);
  const [reductionIncrease, setReductionIncrease] = useState<number>(0);
  const [damageTaken, setDamageTaken] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");

  const [selectedDefenseIndex, setSelectedDefenseIndex] = useState<number>(0);
  const selectedDefense = defenses[selectedDefenseIndex];

  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedReductionType(value as ReductionType);
  };
  
  return (
    <Card className='bg-muted'>

      <CardHeader className='flex gap-4 items-center justify-center'>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Defensywa</CardTitle>

        <SelectOneOf name='defense' defaultValue='0' index={selectedDefenseIndex} items={defenses} setIndex={setSelectedDefenseIndex} />

      </CardHeader>

      <CardContent className='flex flex-col h-full gap-y-4'>

        <FieldView name={"niewrażliwość"} value={selectedDefense.immunity} />
        <FieldView name={"odporność"} value={selectedDefense.resistance} />

        <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

          <FieldViewWithInfo 
            name={<SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>} 
            value={calculateSelectedReduction(selectedDefense, selectedReductionType) + reductionIncrease - damageTaken} 
            infoContent={<DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} reductionIncrease={reductionIncrease} damageTaken={damageTaken} />} 
            valueClassName='pr-3'
          />
  
          <SelectContent>
          {
            allReductionTypes.map(reductionType => (
              <SelectItem key={reductionType} value={reductionType}>
                <span className='capitalize'>{translateReductions(reductionType)}</span>
              </SelectItem>
            ))
          }
          </SelectContent>
        </Select>

        <div className='flex-1 flex flex-col justify-end gap-y-2'>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{namingConventions.increase}</Label>
            <ChangeButtons value={reductionIncreaseChangeAmount} setValue={setReductionIncrease} setChangeAmount={setReductionIncreaseChangeAmount} resetValue={0} />
          </div>
          <div className='flex gap-4'>
            <Label className='text-sm text-muted-foreground w-36'>{namingConventions.damage}</Label>
            <ChangeButtons value={damageTakenChangeAmount} setValue={setDamageTaken} setChangeAmount={setDamageTakenChangeAmount} resetValue={0} />
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

function DefenseReductionInfoContent(input: { defense: Defense, selectedReductionType: ReductionType, reductionIncrease: number, damageTaken: number })
{
  return (
    <div>
      { <FieldView name={namingConventions.increase} value={Math.abs(input.reductionIncrease)} valueClassName='text-green-600' /> }
      { <FieldView name={namingConventions.damage} value={Math.abs(input.damageTaken)} valueClassName='text-red-500' /> }
      {
        Object.entries(input.defense)
          .filter(([name, _]) => reductionSelectFilter(input.selectedReductionType)(name))
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

function reductionSelectFilter(selectedReductionType: ReductionType): (name: string) => boolean
{
  if (selectedReductionType === "full") return fullFilter;
  if (selectedReductionType === "block") return blockFilter;
  if (selectedReductionType === "direct") return directFilter;
  throw new Error("Invalid reduction type");
}

function fullFilter(name: string): boolean 
{
  return name !== "immunity" 
    && name !== "resistance"
    && name !== "name"
    && name !== "description";
} 

function blockFilter(name: string): boolean 
{
  return fullFilter(name) && name !== "dodge" && name !== "parry";
} 

function directFilter(name: string): boolean 
{
  return blockFilter(name) && name !== "block";
}