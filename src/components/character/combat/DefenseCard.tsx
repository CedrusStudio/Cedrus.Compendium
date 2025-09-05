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
import { BsInfoCircle } from "react-icons/bs";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FieldView from '@/components/character/FieldView';
import { useState } from 'react';
import FieldViewWithInfoIcon from '@/components/character/FieldViewWithInfoIcon';

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

      <CardContent className='flex flex-col gap-y-4 -mt-4'>

        <FieldView name={"immunity"} value={input.defense.immunity} />
        <FieldView name={"resistance"} value={input.defense.resistance} />

        <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

          <FieldViewWithInfoIcon 
            name={<SelectTrigger className='capitalize border-0' ><SelectValue /></SelectTrigger>} 
            value={calculateSelectedReduction(input.defense, selectedReductionType)} 
            infoContent={<DefenseInfoContent defense={input.defense} selectedReductionType={selectedReductionType} />} 
            valueClassName='pr-2'
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
      </CardContent>
    </Card>
  );
};

function DefenseInfoContent(input: { defense: Defense, selectedReductionType: ReductionType })
{
  return (
    <div>
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