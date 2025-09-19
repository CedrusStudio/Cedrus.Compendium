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

type DefenseCardProps = 
{
  defense: Defense;
};

type ReductionType = "full" | "block" | "direct";
const allReductionTypes: ReductionType[] = ["full", "block", "direct"];

export default function DefenseCard(input: DefenseCardProps)
{
  const [defenseChangeAmount, setDefenseChangeAmount] = useState<number>(1);
  const [currentDefenseDifference, setCurrentDefenseDifference] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");

  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedReductionType(value as ReductionType);
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Defense</CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-y-4 -mt-4'>

        <FieldView name={"immunity"} value={input.defense.immunity} />
        <FieldView name={"resistance"} value={input.defense.resistance} />

        <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

          <FieldViewWithInfo 
            name={<SelectTrigger className='capitalize border-0' ><SelectValue /></SelectTrigger>} 
            value={calculateSelectedReduction(input.defense, selectedReductionType) + currentDefenseDifference} 
            infoContent={<DefenseInfoContent defense={input.defense} selectedReductionType={selectedReductionType} currentDefenseDifference={currentDefenseDifference} />} 
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

        <ChangeButtons value={defenseChangeAmount} setValue={setCurrentDefenseDifference} setChangeAmount={setDefenseChangeAmount} resetValue={0} />

      </CardContent>
    </Card>
  );
};

function DefenseInfoContent(input: { defense: Defense, selectedReductionType: ReductionType, currentDefenseDifference: number })
{
  return (
    <div>
    {
      input.currentDefenseDifference === 0 ? <></>
        : input.currentDefenseDifference > 0 ? <FieldView key="ReductionIncrease" name="ReductionIncrease" value={Math.abs(input.currentDefenseDifference)} valueClassName='text-green-600' />
        : <FieldView key="DamageTaken" name="DamageTaken" value={Math.abs(input.currentDefenseDifference)} valueClassName='text-red-500' />
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