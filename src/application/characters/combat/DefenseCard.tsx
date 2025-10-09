"use client";

import { allReductionTypes, calculateSelectedReduction, Defense, reductionSelectFilter, ReductionType } from '@/domain/characters/Character';

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
import { translate, translateReductions } from '@/domain/data/translations';
import { namingConventions } from '@/domain/data/namingConventions';
import SelectOneOf from '@/common/components/selects/SelectOneOf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import DefenseReductionInfoContent from '@/application/characters/combat/DefenseReductionInfoContent';
import IconWithTooltip from '@/common/components/fields/IconWithTooltip';
import { immunityIcon, reductionIcons, resistanceIcon } from '@/domain/data/icons';

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

        <FieldView name={<IconWithTooltip icon={immunityIcon} name={translate("immunity")}/>} value={selectedDefense.immunity} />
        <FieldView name={<IconWithTooltip icon={resistanceIcon} name={translate("resistance")}/>} value={selectedDefense.resistance} />

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
                <span className='capitalize'>{reductionIcons[reductionType]}</span>
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
