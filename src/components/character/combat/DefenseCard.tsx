"use client";

import { Defense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FieldView from '@/components/character/FieldView';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type DefenseCardProps = 
{
  defense: Defense;
};

type ReductionType = "full" | "block" | "direct";
const allReductionTypes: ReductionType[] = ["full", "block", "direct"];

export default function DefenseCard(input: DefenseCardProps)
{
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");
  const [isOpen, setIsOpen] = useState(false);

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

      <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

          <FieldView name={"immunity"} value={input.defense.immunity} />
          <FieldView name={"resistance"} value={input.defense.resistance} />

          <div className={'flex gap-x-10 items-center justify-around'}>
              <SelectTrigger className='capitalize'>
                  <SelectValue />
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

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="">

        <div className="flex items-center justify-center gap-4 px-4">
          <CollapsibleTrigger asChild>
            <Button variant="default">
              {isOpen ? 'Show less' : 'Show more'}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="flex flex-col gap-2">

            <CardContent className='flex flex-col gap-y-4'>
            {
                Object.entries(input.defense)
                .filter(([name, _]) => name !== "immunity" && name !== "resistance")
                .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
            }
            </CardContent>
      
        </CollapsibleContent>
      </Collapsible>

      
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