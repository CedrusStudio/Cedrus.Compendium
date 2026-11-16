"use client";

import { setWithSideEffect } from '@/common/global/setterUtils';
import { calculateCriticalDamage, calculateWeaponDamageRoll, DamageOffense, handleDamageOffenseRolls, handleWeaponDamageRolls, Offense, roll, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { makeRollRecord, offensePreset } from '@/domain/diceRoller';
import { dicePoolNames } from '@/application/dice-roller/DiceRollerPanel';

export const useCombatRolls = (offenses: Offense[], defaultOffenseId?: string) => 
{
  const diceRoller = useOptionalDiceRoller();
  const [hasRolled, setHasRolled] = useState(false);
  const getInitialIndex = () => {
    if (!defaultOffenseId) return 0;
    const index = offenses.findIndex(o => o.id === defaultOffenseId);
    return index >= 0 ? index : 0;
  };

  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(getInitialIndex());
  const safeSelectedOffenseIndex = offenses.length === 0 ? 0 : Math.min(selectedOffenseIndex, offenses.length - 1);
  const offense = offenses[safeSelectedOffenseIndex]!;
  const offenseSignature = useMemo(() => JSON.stringify(offense), [offense]);

  const [currentLeadingOffense, setCurrentLeadingOffense] = useState<WeaponOffense>(offense.leadingWeapon);
  const [currentSecondaryOffense, setCurrentSecondaryOffense] = useState<WeaponOffense | undefined>(offense.secondaryWeapon);
  const [currentDamageBonus, setCurrentDamageBonus] = useState<DamageOffense>(offense.damageBonus);
  const [currentAdditionalDamageBonus, setCurrentAdditionalDamageBonus] = useState<DamageOffense | undefined>(offense.additionalDamageBonus);

  const [leadingRolls, setLeadingRolls] = useState<[number, boolean][]>([]);
  const [secondaryRolls, setSecondaryRolls] = useState<[number, boolean][]>([]);
  const [damageBonusRolls, setDamageBonusRolls] = useState<number[]>([]);
  const [additionalDamageBonusRolls, setAdditionalDamageBonusRolls] = useState<number[]>([]);

  const handleRoll = () => 
  {
    setHasRolled(true);
    const { rolls: damageBonusRolls } = handleDamageOffenseRolls(currentDamageBonus);
    const { rolls: additionalDamageBonusRolls } = handleDamageOffenseRolls(currentAdditionalDamageBonus);
    const { rolls: leadingRolls } = handleWeaponDamageRolls(currentLeadingOffense);
    const { rolls: secondaryRolls } = currentSecondaryOffense ? handleWeaponDamageRolls(currentSecondaryOffense) : { rolls: [] };

    setDamageBonusRolls(damageBonusRolls);
    setAdditionalDamageBonusRolls(additionalDamageBonusRolls);
    setLeadingRolls(leadingRolls);
    setSecondaryRolls(secondaryRolls);
  };

  useEffect(() => {
    if (!hasRolled || !diceRoller?.record) return;
    const preset = offensePreset({ ...offense, leadingWeapon: currentLeadingOffense, secondaryWeapon: currentSecondaryOffense, damageBonus: currentDamageBonus, additionalDamageBonus: currentAdditionalDamageBonus }, dicePoolNames);
    diceRoller.record(makeRollRecord(preset, [
      leadingRolls.map(([value, critical]) => ({ value, critical })),
      ...(currentSecondaryOffense ? [secondaryRolls.map(([value, critical]) => ({ value, critical }))] : []),
      damageBonusRolls.map(value => ({ value, critical: false })),
      ...(currentAdditionalDamageBonus ? [additionalDamageBonusRolls.map(value => ({ value, critical: false }))] : []),
    ]));
  }, [hasRolled, leadingRolls, secondaryRolls, damageBonusRolls, additionalDamageBonusRolls, currentLeadingOffense, currentSecondaryOffense, currentDamageBonus, currentAdditionalDamageBonus, offense, diceRoller?.record]);

  const handleWeaponReroll = (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>): void => 
  {
    const [damage, critical] = calculateWeaponDamageRoll(offense);

    setRolls(previousRolls => 
    {
      const newRolls = [...previousRolls];
      newRolls[rollIndex] = [damage, critical > 0];
      return newRolls;
    });
  };
  
  const handleDamageOffenseReroll = (rollIndex: number, damageOffense: DamageOffense, setRolls: Dispatch<SetStateAction<number[]>>) => 
  {
    const damage = roll(damageOffense.grade);

    setRolls(previousRolls => 
    {
      const newRolls = [...previousRolls];
      newRolls[rollIndex] = damage;
      return newRolls;
    });
  };

  const calculateTotalDamage = () =>
  {
    const shouldNotRecalculateTotalDamage = leadingRolls.length === 0 && secondaryRolls.length === 0 && damageBonusRolls.length === 0;
    
    if (shouldNotRecalculateTotalDamage)
    {
      return 0;
    }

    const damageBonusTotal = calculateDamageBonusForRolls(currentDamageBonus, damageBonusRolls);
    const additionalDamageBonusTotal = currentAdditionalDamageBonus ? calculateDamageBonusForRolls(currentAdditionalDamageBonus, additionalDamageBonusRolls) : 0;
    const leadingTotal = calculateWeaponDamageForRolls(currentLeadingOffense, leadingRolls.map(r => r[0]));
    const secondaryTotal = currentSecondaryOffense ? calculateWeaponDamageForRolls(currentSecondaryOffense, secondaryRolls.map(r => r[0])) : 0;
    const totalDamage = damageBonusTotal + additionalDamageBonusTotal + leadingTotal + secondaryTotal;
    return totalDamage;
  };

  const recalculateCriticalLeadingOffense = (offense: WeaponOffense) =>
  {
    if (leadingRolls.length === 0) return;
    setLeadingRolls(prev => prev.map(([value]) => [value, calculateCriticalDamage(offense, value) > 0]));
  };

  const recalculateCriticalSecondaryOffense = (offense: WeaponOffense | undefined) =>
  {
    if (!offense || secondaryRolls.length === 0) return;
    setSecondaryRolls(prev => prev.map(([value]) => [value, calculateCriticalDamage(offense, value) > 0]));
  };

  const handleChangeOffense = (index: number) =>
  {
    setCurrentLeadingOffense(offenses[index].leadingWeapon);
    setCurrentSecondaryOffense(offenses[index].secondaryWeapon);
    setCurrentDamageBonus(offenses[index].damageBonus);
    setCurrentAdditionalDamageBonus(offenses[index].additionalDamageBonus);
    setLeadingRolls([]);
    setSecondaryRolls([]);
    setDamageBonusRolls([]);
    setAdditionalDamageBonusRolls([]);
  };

  const [previousOffense, setPreviousOffense] = useState({ offense, offenseSignature, safeSelectedOffenseIndex });
  if (previousOffense.offense !== offense || previousOffense.offenseSignature !== offenseSignature || previousOffense.safeSelectedOffenseIndex !== safeSelectedOffenseIndex || selectedOffenseIndex !== safeSelectedOffenseIndex)
  {
    setPreviousOffense({ offense, offenseSignature, safeSelectedOffenseIndex });
    setHasRolled(false);
    setSelectedOffenseIndex(safeSelectedOffenseIndex);
    setCurrentLeadingOffense(offense.leadingWeapon);
    setCurrentSecondaryOffense(offense.secondaryWeapon);
    setCurrentDamageBonus(offense.damageBonus);
    setCurrentAdditionalDamageBonus(offense.additionalDamageBonus);
    setLeadingRolls([]);
    setSecondaryRolls([]);
    setDamageBonusRolls([]);
    setAdditionalDamageBonusRolls([]);
  }

  return { 
    totalResult: () => calculateTotalDamage(),
    handleRoll, 
    handleWeaponReroll, 
    handleDamageOffenseReroll,
    leadingRolls,
    setLeadingRolls: setWithSideEffect(setLeadingRolls, () => recalculateCriticalLeadingOffense(currentLeadingOffense)),
    secondaryRolls,
    setSecondaryRolls: setWithSideEffect(setSecondaryRolls, () => recalculateCriticalSecondaryOffense(currentSecondaryOffense)),
    damageBonusRolls,
    setDamageBonusRolls: setDamageBonusRolls,
    additionalDamageBonusRolls,
    setAdditionalDamageBonusRolls: setAdditionalDamageBonusRolls,
    currentLeadingOffense,
    setCurrentLeadingOffense: setWithSideEffect(setCurrentLeadingOffense, recalculateCriticalLeadingOffense),
    currentSecondaryOffense,
    setCurrentSecondaryOffense: setWithSideEffect(setCurrentSecondaryOffense, recalculateCriticalSecondaryOffense),
    currentDamageBonus,
    setCurrentDamageBonus: setCurrentDamageBonus,
    currentAdditionalDamageBonus,
    setCurrentAdditionalDamageBonus: setCurrentAdditionalDamageBonus,
    selectedOffenseIndex: safeSelectedOffenseIndex,
    setSelectedOffenseIndex: setWithSideEffect(setSelectedOffenseIndex, handleChangeOffense)
  };
};

function calculateWeaponDamageForRolls(offense: WeaponOffense, rolls: number[]) : number
{
  let totalOffenseDamage = 0;

  for (let i = 0; i < rolls.length; i++) 
  {
    const roll = rolls[i];
    const weaponDiceDamageWithoutCritical = roll + offense.bonus;
    const criticalDamage = calculateCriticalDamage(offense, roll);
    totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
  }

  return totalOffenseDamage;
};

function calculateDamageBonusForRolls(damageOffense: DamageOffense, rolls: number[]): number
{
  let totalDamageBonus = 0;

  for (let i = 0; i < rolls.length; i++) 
  {
    const roll = rolls[i];
    totalDamageBonus += roll;
  }

  return totalDamageBonus + damageOffense.bonus;
}
