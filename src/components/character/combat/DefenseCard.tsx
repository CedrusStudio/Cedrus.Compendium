"use client";

import { Defense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FieldView from '@/components/character/FieldView';
import { useState } from 'react';

type DefenseCardProps = 
{
  defense: Defense;
};

type ReductionType = "full" | "block" | "direct";
const allReductionTypes: ReductionType[] = ["full", "block", "direct"];

export default function DefenseCard(input: DefenseCardProps)
{
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

      <CardContent className='flex flex-col gap-y-4'>

        <FieldView name={"immunity"} value={input.defense.immunity} />
        <FieldView name={"resistance"} value={input.defense.resistance} />

        <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

          <div className={'flex gap-x-10 items-center justify-around'}>
            <SelectTrigger className='capitalize border-0' >
              <HoverCard openDelay={350} closeDelay={100}>
                <HoverCardTrigger><SelectValue /></HoverCardTrigger>
                <HoverCardContent>
                {
                    Object.entries(input.defense)
                    .filter(([name, _]) => selectFilter(selectedReductionType)(name))
                    .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
                }
                </HoverCardContent>
              </HoverCard>
            </SelectTrigger>
            <div className="w-8">{calculateSelectedReduction(input.defense, selectedReductionType)}</div>
          </div>
  
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
      </CardContent>
    </Card>
  );
};

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