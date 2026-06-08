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
import { displayedText } from '@/common/translations';
import SelectOneOf from '@/common/components/selects/SelectOneOf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import DefenseReductionInfoContent from '@/application/characters/combat/DefenseReductionInfoContent';
import FieldWithTooltip from '@/common/components/fields/FieldWithTooltip';
import { gainIcon, immunityIcon, lossIcon, reductionIcons, resistanceIcon, showHideIcon } from '@/common/icons';
import { DispatchSetInput, setIf } from '@/common/global/resolveSetState';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import ResetButton from '@/common/components/buttons/ResetButton';
import { Button } from '@/ui/button';

type DefenseCardProps = 
{
  defenses: Defense[];
  defaultDefenseId?: string;
};

export default function DefenseCard({ defenses, defaultDefenseId }: DefenseCardProps)
{
  const [reductionIncreaseChangeAmount, setReductionIncreaseChangeAmount] = useState<number>(1);
  const [damageTakenChangeAmount, setDamageTakenChangeAmount] = useState<number>(1);
  const [reductionIncrease, setReductionIncrease] = useState<number>(0);
  const [damageTaken, setDamageTaken] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");

  const getInitialDefenseIndex = () => {
    if (!defaultDefenseId) return 0;
    const index = defenses.findIndex(d => d.id === defaultDefenseId);
    return index >= 0 ? index : 0;
  };

  const [selectedDefenseIndex, setSelectedDefenseIndex] = useState<number>(getInitialDefenseIndex());
  const safeSelectedDefenseIndex = defenses.length === 0 ? 0 : Math.min(selectedDefenseIndex, defenses.length - 1);
  const selectedDefense = defenses[safeSelectedDefenseIndex];
  const [immunity, setImmunity] = useState<number>(selectedDefense?.immunity ?? 0);
  const [resistance, setResistance] = useState<number>(selectedDefense?.resistance ?? 0);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState<boolean>(true);

  const defenseDescription = selectedDefense?.description?.trim();
  const hasDescription = Boolean(defenseDescription);
  const descriptionToggleLabel = isDescriptionVisible ? displayedText.hideDescription : displayedText.showDescription;

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

  const toggleDescriptionVisibility = () =>
  {
    setIsDescriptionVisible(previousValue => !previousValue);
  };

  useEffect(() =>
  {
    if (defenses.length > 0 && selectedDefenseIndex > defenses.length - 1)
    {
      setSelectedDefenseIndex(0);
    }
  }, [defenses.length, selectedDefenseIndex]);

  useEffect(() => 
  {
    if (!selectedDefense)
    {
      return;
    }

    setImmunity(selectedDefense.immunity);
    setResistance(selectedDefense.resistance);
    setIsDescriptionVisible(true);
  }, [selectedDefense]);

  if (!selectedDefense)
  {
    return null;
  }
  
  return (
    <Card className='bg-muted flex flex-col h-full w-full'>

      <CardHeader className='flex flex-col gap-3 items-center justify-center'>
        <div className='relative flex w-full items-center justify-center'>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{displayedText.defense}</CardTitle>

        {
          hasDescription && (
            <Button
              type='button'
              variant='ghost'
              className='absolute right-0 h-8 w-8 p-0 text-muted-foreground'
              onClick={toggleDescriptionVisibility}
              aria-expanded={isDescriptionVisible}
              aria-label={descriptionToggleLabel}
              title={descriptionToggleLabel}
            >
              {showHideIcon(!isDescriptionVisible, 'h-4 w-4')}
            </Button>
          )
        }
        </div>

        {
          defenses.length > 1 && (
            <SelectOneOf
              name='defense'
              defaultValue='0'
              index={safeSelectedDefenseIndex}
              items={defenses}
              setIndex={setSelectedDefenseIndex}
              disableInfo
            />
          )
        }
      </CardHeader>

      <CardContent className='flex flex-col flex-1 gap-5 place-items-center place-content-center'>

        {
          hasDescription && isDescriptionVisible && (
            <p className='max-w-md text-center text-sm italic text-muted-foreground'>
              {defenseDescription}
            </p>
          )
        }

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
