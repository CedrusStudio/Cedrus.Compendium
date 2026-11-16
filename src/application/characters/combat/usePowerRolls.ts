"use client";

import { setWithSideEffect } from '@/common/global/setterUtils';
import { calculateCriticalDamage, calculateWeaponDamageRoll, handleDamageOffenseRolls, handleWeaponDamageRolls, roll } from '@/domain/characters/combat/Offense';
import { PowerOffense, SpellDamage, SpellOffense } from '@/domain/characters/combat/Power';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { makeRollRecord, powerPreset } from '@/domain/diceRoller';
import { displayedText } from '@/common/translations';
import { dicePoolNames } from '@/application/dice-roller/DiceRollerPanel';

export const usePowerRolls = (offenses: PowerOffense[], selectedIndex: number) => 
{
  const diceRoller = useOptionalDiceRoller();
  const [hasRolled, setHasRolled] = useState(false);
  const offense = useMemo(() => offenses[selectedIndex], [offenses, selectedIndex]);

  const [currentSpellOffense, setCurrentSpellOffense] = useState<SpellOffense>(offense.spellOffense);
  const [currentSpellDamage, setCurrentSpellDamage] = useState<SpellDamage>(offense.spellDamage);

  const [spellOffenseRolls, setSpellOffenseRolls] = useState<[number, boolean][]>([]);
  const [spellDamageRolls, setSpellDamageRolls] = useState<number[]>([]);

  const [previousOffense, setPreviousOffense] = useState(offense);
  if (previousOffense !== offense)
  {
    setPreviousOffense(offense);
    setHasRolled(false);
    setCurrentSpellOffense(offense.spellOffense);
    setCurrentSpellDamage(offense.spellDamage);
    setSpellOffenseRolls([]);
    setSpellDamageRolls([]);
  }

  const handleRoll = () => 
  {
    setHasRolled(true);
    const { rolls: spellDamageRolls } = handleDamageOffenseRolls(currentSpellDamage);
    const { rolls: spellOffenseRolls } = handleWeaponDamageRolls(currentSpellOffense);

    setSpellDamageRolls(spellDamageRolls);
    setSpellOffenseRolls(spellOffenseRolls);
  };

  useEffect(() => {
    if (!hasRolled || !diceRoller?.record) return;
    diceRoller.record(makeRollRecord(powerPreset(displayedText.power, { ...offense, spellOffense: currentSpellOffense, spellDamage: currentSpellDamage }, dicePoolNames), [
      spellOffenseRolls.map(([value, critical]) => ({ value, critical })),
      spellDamageRolls.map(value => ({ value, critical: false })),
    ]));
  }, [hasRolled, spellOffenseRolls, spellDamageRolls, currentSpellOffense, currentSpellDamage, offense, diceRoller?.record]);

  const handleSpellOffenseReroll = (rollIndex: number, offense: SpellOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>): void => 
  {
    const [damage, critical] = calculateWeaponDamageRoll(offense);

    setRolls(previousRolls => 
    {
      const newRolls = [...previousRolls];
      newRolls[rollIndex] = [damage, critical > 0];
      return newRolls;
    });
  };
  
  const handleSpellDamageReroll = (rollIndex: number, spellDamage: SpellDamage, setRolls: Dispatch<SetStateAction<number[]>>) => 
  {
    const damage = roll(spellDamage.grade);

    setRolls(previousRolls => 
    {
      const newRolls = [...previousRolls];
      newRolls[rollIndex] = damage;
      return newRolls;
    });
  };

  const calculateTotalDamage = () =>
  {
    const shouldNotRecalculateTotalDamage = spellOffenseRolls.length === 0 && spellDamageRolls.length === 0;
    
    if (shouldNotRecalculateTotalDamage)
    {
      return 0;
    }

    const spellDamageTotal = calculateSpellDamageForRolls(currentSpellDamage, spellDamageRolls);
    const spellOffenseTotal = calculateSpellOffenseForRolls(currentSpellOffense, spellOffenseRolls.map(r => r[0]));
    const totalDamage = spellDamageTotal + spellOffenseTotal;
    return totalDamage;
  };

  const recalculateCriticalSpellOffense = (offense: SpellOffense) =>
  {
    if (spellOffenseRolls.length === 0) return;
    setSpellOffenseRolls(prev => prev.map(([value]) => [value, calculateCriticalDamage(offense, value) > 0]));
  };

  return { 
    totalResult: () => calculateTotalDamage(),
    handleRoll, 
    handleSpellOffenseReroll, 
    handleSpellDamageReroll,
    spellOffenseRolls,
    setSpellOffenseRolls: setWithSideEffect(setSpellOffenseRolls, () => recalculateCriticalSpellOffense(currentSpellOffense)),
    spellDamageRolls,
    setSpellDamageRolls: setSpellDamageRolls,
    currentSpellOffense,
    setCurrentSpellOffense: setWithSideEffect(setCurrentSpellOffense, recalculateCriticalSpellOffense),
    currentSpellDamage,
    setCurrentSpellDamage: setCurrentSpellDamage,
  };
};

function calculateSpellOffenseForRolls(offense: SpellOffense, rolls: number[]) : number
{
  let totalOffenseDamage = 0;

  for (let i = 0; i < rolls.length; i++) 
  {
    const roll = rolls[i];
    const spellDiceDamageWithoutCritical = roll + offense.bonus;
    const criticalDamage = calculateCriticalDamage(offense, roll);
    totalOffenseDamage += (spellDiceDamageWithoutCritical + criticalDamage);
  }

  return totalOffenseDamage;
};

function calculateSpellDamageForRolls(spellDamage: SpellDamage, rolls: number[]): number
{
  let totalDamageBonus = 0;

  for (let i = 0; i < rolls.length; i++) 
  {
    const roll = rolls[i];
    totalDamageBonus += roll;
  }

  return totalDamageBonus + spellDamage.bonus;
}
