"use client";

import { setWithSideEffect } from '@/common/global/setterUtils';
import { calculateCriticalDamage, calculateWeaponDamageRoll, DamageOffense, handleDamageOffenseRolls, handleWeaponDamageRolls, Offense, roll, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Dispatch, SetStateAction, useState } from 'react';

export const useCombatRolls = (offense: Offense) => 
{
  const [currentLeadingOffense, setCurrentLeadingOffense] = useState<WeaponOffense>(offense.leadingWeapon);
  const [currentSecondaryOffense, setCurrentSecondaryOffense] = useState<WeaponOffense | undefined>(offense.secondaryWeapon);
  const [currentDamageBonus, setCurrentDamageBonus] = useState<DamageOffense>(offense.damageBonus);

  const [leadingRolls, setLeadingRolls] = useState<[number, boolean][]>([]);
  const [secondaryRolls, setSecondaryRolls] = useState<[number, boolean][]>([]);
  const [damageBonusRolls, setDamageBonusRolls] = useState<number[]>([]);

  const handleRoll = () => 
  {
    const { rolls: damageBonusRolls } = handleDamageOffenseRolls(currentDamageBonus);
    const { rolls: leadingRolls } = handleWeaponDamageRolls(currentLeadingOffense);
    const { rolls: secondaryRolls } = currentSecondaryOffense ? handleWeaponDamageRolls(currentSecondaryOffense) : { rolls: [] };

    setDamageBonusRolls(damageBonusRolls);
    setLeadingRolls(leadingRolls);
    setSecondaryRolls(secondaryRolls);
  };

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
    const leadingTotal = calculateWeaponDamageForRolls(currentLeadingOffense, leadingRolls.map(r => r[0]));
    const secondaryTotal = currentSecondaryOffense ? calculateWeaponDamageForRolls(currentSecondaryOffense, secondaryRolls.map(r => r[0])) : 0;
    const totalDamage = damageBonusTotal + leadingTotal + secondaryTotal;
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
    currentLeadingOffense,
    setCurrentLeadingOffense: setWithSideEffect(setCurrentLeadingOffense, recalculateCriticalLeadingOffense),
    currentSecondaryOffense,
    setCurrentSecondaryOffense: setWithSideEffect(setCurrentSecondaryOffense, recalculateCriticalSecondaryOffense),
    currentDamageBonus,
    setCurrentDamageBonus: setCurrentDamageBonus,
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