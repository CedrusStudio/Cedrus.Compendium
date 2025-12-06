"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { displayedText } from "@/common/translations";
import { Power, Spell } from "@/domain/characters/combat/Power";
import { Field } from '@/common/components/fields';
import { getBadgeVariant, getCastTimeColors } from '@/common/colors';
import { battleIcon, cooldownIcon, costIcon, nextIcon, removePreviousIcon, resetIcon } from '@/common/icons';
import { canUseCastable, EndTurn } from '@/domain/characters/Castable';
import { useState } from 'react';
import InfoContentWithTags from '@/common/components/tags/InfoContentWithTags';
import { useQuery } from '@tanstack/react-query';
import powerSpecificationsClient from '@/infrastructure/clients/powerSpecificationsClient';
import PowerRollsCard from '@/application/characters/combat/power/PowerRollsCard';
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { gainIcon, lossIcon } from '@/common/icons';
import { DispatchSetInput, setIf } from '@/common/global/resolveSetState';
import PowerOffenseSelector from '@/application/characters/combat/power/PowerOffenseSelector';

type PowerCardProps =
{
  power: Power;
}

export default function PowerCard({ power }: PowerCardProps)
{
  const [usedSpells, setUsedSpells] = useState<(Spell | EndTurn)[]>([]);
  const [currentEssence, setCurrentEssence] = useState<number>(power.essence);
  const [essenceIncrease, setEssenceIncrease] = useState<number>(0);
  const [essenceIncreaseChangeAmount, setEssenceIncreaseChangeAmount] = useState<number>(1);
  const [essenceLoss, setEssenceLoss] = useState<number>(0);
  const [essenceLossChangeAmount, setEssenceLossChangeAmount] = useState<number>(1);
  
  // Calculate default offense index based on level + bonus
  const defaultOffenseIndex = power.level + power.bonus;
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(defaultOffenseIndex);

  // Fetch the PowerSpecification
  const { data: powerSpecification } = useQuery
  ({
    queryKey: ['powerSpecification', power.powerSpecificationId],
    queryFn: () => powerSpecificationsClient.get(power.powerSpecificationId),
    enabled: !!power.powerSpecificationId && power.powerSpecificationId.length > 0,
    staleTime: 5_000
  });

  const addSpellToUsed = (spell: Spell | EndTurn) =>
  {
    setUsedSpells(prev => [...prev, spell]);
  }

  const removeLastSpell = () =>
  {
    const lastSpell = usedSpells[usedSpells.length - 1];

    if (lastSpell && lastSpell !== "end")
    {
      setCurrentEssence(prev => Math.min(power.essence, prev + lastSpell.cost));
    }

    setUsedSpells(prev => prev.slice(0, -1));
  }

  const endTurn = () =>
  {
    setUsedSpells(prev => [...prev, "end"]);
  }

  const reduceEssence = (cost: number) =>
  {
    setCurrentEssence(prev => Math.max(0, prev - cost));
  }

  const resetEssence = () =>
  {
    setCurrentEssence(power.essence);
    setEssenceIncrease(0);
    setEssenceLoss(0);
  }

  function setEssenceIncreaseIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setEssenceIncrease(value), dispatchInput, essenceIncrease);
  }

  function setEssenceLossIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setEssenceLoss(value), dispatchInput, essenceLoss);
  }

  return (
    <Card className='bg-muted'>
      <CardHeader>
        
        <CardTitle className="flex flex-col lg:flex-row place-content-around place-item-center">

          <div className="flex place-items-center place-content-center mb-4 gap-4">
            <span className="capitalize font-bold text-2xl text-primary">{power.name}</span>
            <Badge variant="outline" className="p-2 capitalize">
              {power.type}
            </Badge>

            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">{displayedText.level}</span>
              <span className="font-bold text-lg text-primary">{power.level}</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">{displayedText.bonus}</span>
              <span className="font-bold text-lg text-primary">{power.bonus}</span>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row justify-center items-center gap-4'>

            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">{displayedText.essence}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-primary">{currentEssence + essenceIncrease - essenceLoss}</span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="font-bold text-lg text-muted-foreground">{power.essence}</span>
              </div>
            </div>

            <div className='flex flex-col gap-y-2'>
              <div className='flex gap-2 items-center justify-center'>
                <Label className='text-xs text-muted-foreground'>{gainIcon("size-5")}</Label>
                <ChangeButtons value={essenceIncreaseChangeAmount} setValue={setEssenceIncreaseIfPositive} setChangeAmount={setEssenceIncreaseChangeAmount} resetValue={0} />
              </div>
              <div className='flex gap-2 items-center justify-center'>
                <Label className='text-xs text-muted-foreground'>{lossIcon("size-5")}</Label>
                <ChangeButtons value={essenceLossChangeAmount} setValue={setEssenceLossIfPositive} setChangeAmount={setEssenceLossChangeAmount} resetValue={0} />
              </div>
            </div>
            
          </div>

          {
            powerSpecification && (
              <PowerOffenseSelector 
                powerSpecification={powerSpecification!}
                selectedIndex={selectedOffenseIndex}
                onSelectIndex={setSelectedOffenseIndex}
              />
            )
          }

        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2'>

        {
          (powerSpecification && powerSpecification.offenses && powerSpecification.offenses.length > 0) && (
            <div className="col-span-full">
              <PowerRollsCard 
                offenses={powerSpecification.offenses}
                selectedIndex={Math.min(selectedOffenseIndex, powerSpecification.offenses.length - 1)}
              />
            </div>
          )
        }

        {
          power.spells.map(spell => <SpellView key={spell.id} spell={spell} addSpellToUsed={addSpellToUsed} usedSpells={usedSpells} reduceEssence={reduceEssence} currentEssence={currentEssence} />)
        }

        <MediumUsedSpellsView usedSpells={usedSpells} removeLastSpell={removeLastSpell} setUsedSpells={setUsedSpells} endTurn={endTurn} resetEssence={resetEssence} />
        <SmallUsedSpellsView usedSpells={usedSpells} removeLastSpell={removeLastSpell} setUsedSpells={setUsedSpells} endTurn={endTurn} resetEssence={resetEssence} />
      
      </CardContent>

    </Card>
  );
};

type UsedSpellsViewProps =
{
  usedSpells: (Spell | EndTurn)[];
  removeLastSpell: () => void;
  setUsedSpells: (usedSpells: (Spell | EndTurn)[]) => void;
  endTurn: () => void;
  resetEssence: () => void;
}

function SmallUsedSpellsView({ usedSpells, removeLastSpell, setUsedSpells, endTurn, resetEssence }: UsedSpellsViewProps)
{
  return (
    <div className="lg:grid-cols-13 col-span-full lg:hidden">

      <div className="text-sm lg:col-span-10 text-muted-foreground italic flex flex-wrap sm:gap-1 lg:gap-2 py-3">
      {
        usedSpells.map((usedSpell, index) => 
        {
          if (usedSpell === "end") return (
            <Badge key={index} variant="destructive" className='m-1' >
              {nextIcon()}
            </Badge>
          );

          return (
            <Badge key={index} variant={getBadgeVariant(usedSpell.castTime)} className='m-1' >
              {usedSpell.name}
            </Badge>
          );
        })
      }
      </div>

      <div className="flex gap-4 justify-center items-center">
        <Button variant="default" className='flex-1 lg:flex-0' onClick={() => { setUsedSpells([]); resetEssence(); }}>
          {resetIcon()}
        </Button>

        <Button variant="default" className='flex-1 lg:flex-0' onClick={removeLastSpell}>
          {removePreviousIcon()}
        </Button>

        <Button variant="default" className='flex-1 lg:flex-0' onClick={endTurn}>
          {nextIcon()}
        </Button>
      </div>
    </div>
  );
}

function MediumUsedSpellsView({ usedSpells, removeLastSpell, setUsedSpells, endTurn, resetEssence }: UsedSpellsViewProps)
{
  return (
    <div className="hidden lg:grid grid-cols-13 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full">

      <Button variant="default" className='col-span-1' onClick={() => { setUsedSpells([]); resetEssence(); }}>
        {resetIcon()}
      </Button>

      <p className="text-sm col-span-10">
        <span className='text-muted-foreground italic'>
        {
          usedSpells.map((usedSpell, index) => 
          {
            if (usedSpell === "end") return (
              <Badge key={index} variant="destructive" className='m-1' >
                {nextIcon()}
              </Badge>
            );

            return (
              <Badge key={index} variant={getBadgeVariant(usedSpell.castTime)} className='m-1' >
                {usedSpell.name}
              </Badge>
            );
          })
        }
        </span>
      </p>

      <Button variant="default" className='col-span-1' onClick={removeLastSpell}>
        {removePreviousIcon()}
      </Button>

      <Button variant="default" className='col-span-1' onClick={endTurn}>
        {nextIcon()}
      </Button>
    </div>
  );
}

type SpellViewProps =
{
  spell: Spell;
  addSpellToUsed: (spell: Spell | EndTurn) => void;
  usedSpells: (Spell | EndTurn)[];
  reduceEssence: (cost: number) => void;
  currentEssence: number;
}

function SpellView({ spell, addSpellToUsed, usedSpells, reduceEssence, currentEssence }: SpellViewProps) 
{
  const canAffordSpell = currentEssence >= spell.cost;

  const canUseSpell = (spell: Spell, usedSpells: (Spell | EndTurn)[]) =>
  {
    return canUseCastable(spell, usedSpells) && canAffordSpell;
  };

  const handleUseSpell = (spell: Spell) =>
  {
    addSpellToUsed(spell);
    reduceEssence(spell.cost);
  };

  return (
    <div className='flex m-1 p-1 w-full h-full'>

      <div className='flex items-center justify-center p-2 border rounded-l-md flex-1'>
        <Field value={spell.grade} className="gap-1">
          <Field.Label className='w-4xs'>{spell.name}</Field.Label>
          <Field.Value />
          <Field.Info className={`${getCastTimeColors(spell.castTime).text}`}>
            <InfoContentWithTags castable={spell} />
          </Field.Info>
        </Field>
      </div>

      <div className='flex items-center justify-center'>
        <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-none' variant="cost">
          <span className="scale-100">{costIcon}</span>
          <span>{spell.cost}</span>
        </Badge>
        <Button variant="ghost" className="h-full p-0" onClick={() => handleUseSpell(spell)} disabled={!canUseSpell(spell, usedSpells)}>
          <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none' variant={getBadgeVariant(spell.castTime)}>
            {cooldownIcon()}
            <span>{spell.cooldown || battleIcon("scale-80")}</span>
          </Badge>
        </Button>
      </div>

    </div>
  );
}
