"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/characters/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import DamageBonusView from '@/application/characters/combat/DamageBonusView';
import RollButton from "@/common/components/buttons/RollButton";
import Subcard from '@/common/components/Subcard';
import WeaponDamageView from '@/application/characters/combat/WeaponDamageCard';
import CriticalView from '@/application/characters/combat/CriticalView';
import { GiRollingDices } from "react-icons/gi";
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import SelectOneOf from '@/common/components/selects/SelectOneOf';

type OffenseCardProps = 
{
  offenses: Offense[];
};

export default function OffenseCard({ offenses }: OffenseCardProps)
{
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(0);
  const selectedOffense = offenses[selectedOffenseIndex];

  const leadingOffense = selectedOffense.leadingWeapon;
  const secondaryOffense = selectedOffense.secondaryWeapon;
  const damageBonus = selectedOffense.damageBonus;

  const [currentLeadingOffense, setCurrentLeadingOffense] = useState<WeaponOffense>(leadingOffense);
  const [currentSecondaryOffense, setCurrentSecondaryOffense] = useState<WeaponOffense | undefined>(secondaryOffense);
  const [currentDamageBonus, setCurrentDamageBonus] = useState<DamageOffense>(damageBonus);

  const [leadingRolls, setLeadingRolls] = useState<[number, boolean][]>([]);
  const [secondaryRolls, setSecondaryRolls] = useState<[number, boolean][]>([]);
  const [damageBonusRolls, setDamageBonusRolls] = useState<number[]>([]);
  const [rollTotalResult, setRollTotalResult] = useState<number | null>(null);

  // Reset state when selectedOffenseIndex changes
  useEffect(() => 
  {
    setCurrentLeadingOffense(leadingOffense);
    setCurrentSecondaryOffense(secondaryOffense);
    setCurrentDamageBonus(damageBonus);
    setLeadingRolls([]);
    setSecondaryRolls([]);
    setDamageBonusRolls([]);
    setRollTotalResult(null);
  }, [selectedOffenseIndex, leadingOffense, secondaryOffense, damageBonus]);

  useEffect(() => 
  {
    const shouldNotRecalculateTotalDamage = leadingRolls.length === 0 && secondaryRolls.length === 0 && damageBonusRolls.length === 0;
    if (shouldNotRecalculateTotalDamage)
    {
      setRollTotalResult(null);
      return;
    }

    const damageBonusTotal = calculateDamageBonusForRolls(currentDamageBonus, damageBonusRolls);
    const leadingTotal = calculateWeaponDamageForRolls(currentLeadingOffense, leadingRolls.map(r => r[0]));
    const secondaryTotal = currentSecondaryOffense ? calculateWeaponDamageForRolls(currentSecondaryOffense, secondaryRolls.map(r => r[0])) : 0;
    const totalDamage = damageBonusTotal + leadingTotal + secondaryTotal;
    setRollTotalResult(totalDamage);
  }, [leadingRolls, secondaryRolls, damageBonusRolls, currentLeadingOffense, currentSecondaryOffense, currentDamageBonus]);

  const handleRoll = () => 
  {
    const { total: damageBonusTotal, rolls: damageBonusRolls } = handleDamageBonusRolls(currentDamageBonus);
    const { total: leadingTotal, rolls: leadingRolls } = handleWeaponDamageRolls(currentLeadingOffense);
    const { total: secondaryTotal, rolls: secondaryRolls } = currentSecondaryOffense ? handleWeaponDamageRolls(currentSecondaryOffense) : { total: 0, rolls: [] };

    setDamageBonusRolls(damageBonusRolls);
    setLeadingRolls(leadingRolls);
    setSecondaryRolls(secondaryRolls);

    const totalDamage = damageBonusTotal + leadingTotal + secondaryTotal;
    setRollTotalResult(totalDamage);
  };

  const handleWeaponReroll = (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>): void => 
  {
    const [damage, critical] = handleWeaponDamageRoll(offense);
    
    setRolls(previousRolls => 
    {
      const newRolls = [...previousRolls];
      newRolls[rollIndex] = [damage, critical > 0];
      return newRolls;
    });
  };

  const handleDamageBonusReroll = (rollIndex: number, damageOffense: DamageOffense, setRolls: Dispatch<SetStateAction<number[]>>) => 
  {
    const damage = handleDamageOffenseRoll(damageOffense);

    setRolls(previousRolls => 
    {
      const newRolls = [...previousRolls];
      newRolls[rollIndex] = damage;
      return newRolls;
    });
  };

  // Recompute critical flags for leading weapon when crit range/grade change
  useEffect(() => 
  {
    if (leadingRolls.length === 0) return;
    setLeadingRolls(prev => prev.map(([value]) => [value, handleCriticalDamage(currentLeadingOffense, value) > 0]));
  }, [currentLeadingOffense.critical.range, currentLeadingOffense.grade, leadingRolls.length, currentLeadingOffense]);

  // Recompute critical flags for secondary weapon when crit range/grade change
  useEffect(() => 
  {
    if (!currentSecondaryOffense || secondaryRolls.length === 0) return;
    setSecondaryRolls(prev => prev.map(([value]) => [value, handleCriticalDamage(currentSecondaryOffense, value) > 0]));
  }, [currentSecondaryOffense?.critical.range, currentSecondaryOffense?.grade, secondaryRolls.length, currentSecondaryOffense]);

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>
          <div className='flex justify-center items-center gap-x-4'>
            <span>Ofensywa</span>
            <div className='mt-1'>
              <RollButton onClick={handleRoll} rollResult={rollTotalResult} />
            </div>
            <SelectOneOf name='defense' defaultValue='0' index={selectedOffenseIndex} items={offenses} setIndex={setSelectedOffenseIndex} />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className={ `grid grid-cols-1 gap-1 ${currentSecondaryOffense ? `md:grid-cols-9` : `md:grid-cols-6` }` }>

        <WeaponDamageWithCriticalSubcard 
          name='Wiodąca'
          weaponOffense={currentLeadingOffense}
          rolls={leadingRolls}
          setRolls={setLeadingRolls}
          setOffense={setCurrentLeadingOffense}
          handleWeaponReroll={handleWeaponReroll}
          resetCallback={() => setCurrentLeadingOffense(leadingOffense)}
        />
            
        {
          currentSecondaryOffense && (
            <WeaponDamageWithCriticalSubcard 
              name='Wtórna'
              weaponOffense={currentSecondaryOffense}
              rolls={secondaryRolls}
              setRolls={setSecondaryRolls}
              setOffense={weaponOffense => setCurrentSecondaryOffense(weaponOffense as WeaponOffense)}
              handleWeaponReroll={handleWeaponReroll}
              resetCallback={() => setCurrentSecondaryOffense(secondaryOffense)}
            />
          ) 
        }

        <Subcard name='Bonus' className='col-span-3' callback={() => setCurrentDamageBonus(damageBonus)}> 
          <DamageBonusWithRolls 
            damageOffense={currentDamageBonus} 
            rolls={damageBonusRolls} 
            onReroll={(index: number, damageBonus: DamageOffense) => handleDamageBonusReroll(index, damageBonus, setDamageBonusRolls)}
            setAmount={action => setCurrentDamageBonus(prev => 
            {
              const nextAmount = typeof action === "function" ? action(prev.amount) : action;
              if (nextAmount < 0) return prev;
              return { ...prev, amount: nextAmount };
            })}
            setGrade={action => setCurrentDamageBonus(prev => 
            {
              const nextGrade = typeof action === "function" ? action(prev.grade) : action;
              if (nextGrade < 1) return prev;
              return { ...prev, grade: nextGrade };
            })}
            setBonus={action => setCurrentDamageBonus(prev => 
            {
              const nextBonus = typeof action === "function" ? action(prev.bonus) : action;
              return { ...prev, bonus: nextBonus };
            })}
          />
        </Subcard>
        
      </CardContent>
    </Card>
  );
}

type WeaponDamageWithCriticalSubcardProps =
{
  name: string;
  weaponOffense: WeaponOffense;
  rolls: [number, boolean][];
  setRolls: React.Dispatch<React.SetStateAction<[number, boolean][]>>;
  setOffense: React.Dispatch<React.SetStateAction<WeaponOffense>>;
  handleWeaponReroll: (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => void;
  resetCallback: () => void;
};

function WeaponDamageWithCriticalSubcard(input: WeaponDamageWithCriticalSubcardProps)
{
  return (
    <Subcard className='col-span-3' name={input.name} callback={input.resetCallback}>
      <WeaponDamageWithCriticalAndRolls 
        weaponOffense={input.weaponOffense} 
        rolls={input.rolls} 
        onReroll={(index: number, offense: WeaponOffense) => input.handleWeaponReroll(index, offense, input.setRolls)}
        setPower={action => input.setOffense(prev => 
        {
          const nextPower = typeof action === "function" ? action(prev.critical.power) : action;
          return { ...prev, critical: { ...prev.critical, power: nextPower } };
        })}
        setRange={action => input.setOffense(prev => 
        {
          const nextRange = typeof action === "function" ? action(prev.critical.range) : action;
          if (nextRange < 0 || nextRange > prev.grade * 2) return prev;
          return { ...prev, critical: { ...prev.critical, range: nextRange } };
        })}
        setAmount={action => input.setOffense(prev => 
        {
          const nextAmount = typeof action === "function" ? action(prev.amount) : action;
          if (nextAmount < 0) return prev;
          return { ...prev, amount: nextAmount };
        })}
        setGrade={action => input.setOffense(prev => 
        {
          const nextGrade = typeof action === "function" ? action(prev.grade) : action;
          if (nextGrade < 1) return prev;
          return { ...prev, grade: nextGrade };
        })}
        setBonus={action => input.setOffense(prev => 
        {
          const nextBonus = typeof action === "function" ? action(prev.bonus) : action;
          return { ...prev, bonus: nextBonus };
        })}
      />
  </Subcard>
  )
}

type WeaponDamageWithCriticalAndRollsProps =
{
  weaponOffense: WeaponOffense;
  rolls: [number, boolean][];
  onReroll: (index: number, offense: WeaponOffense) => void;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
  setRange: React.Dispatch<React.SetStateAction<number>>;
};

function WeaponDamageWithCriticalAndRolls({ weaponOffense, rolls, onReroll, setPower, setRange, setAmount, setGrade, setBonus }: WeaponDamageWithCriticalAndRollsProps)
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex justify-center gap-x-3'>
        <WeaponDamageView weaponOffense={weaponOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
      </div>
      <CriticalView weaponOffense={weaponOffense} setPower={setPower} setRange={setRange} />
      <RollsView rolls={rolls} onReroll={(index) => onReroll(index, weaponOffense)} />
    </div>
  )
};

type DamageBonusWithRollsProps =
{
  damageOffense: DamageOffense;
  rolls: number[];
  onReroll: (index: number, damageBonus: DamageOffense) => void;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
};

function DamageBonusWithRolls({ damageOffense, rolls, onReroll, setAmount, setGrade, setBonus }: DamageBonusWithRollsProps)
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex justify-center gap-x-3'>
        <DamageBonusView damageOffense={damageOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
      </div>
      <RollsView rolls={rolls} onReroll={(index) => onReroll(index, damageOffense)} />
    </div>
  )
};

function RollsView<T extends number | [number, boolean]>({ rolls, onReroll }: { rolls: T[], onReroll: (index: number) => void  }) 
{
  if (rolls.length === 0) return null;

  return (
    <div className='flex flex-col items-center'>
      <div className='flex gap-x-1'>
        {
          rolls.map((roll, index) => 
          {
            const isTuple = Array.isArray(roll);
            const rollValue = isTuple ? roll[0] : roll;
            const isCritical = isTuple ? roll[1] : false;
            
            return (
              <Badge 
                key={index} 
                className={`flex flex-row rounded-full px-1 font-mono ${isCritical ? 'bg-yellow-300' : ''}`}
              >
                <div className='flex items-center gap-x-1'>
                  <Button asChild variant="ghost" className="h-full w-full p-0 hover:bg-transparent hover:text-current" onClick={() => onReroll(index)}>
                    <GiRollingDices />
                  </Button>
                </div>
                {rollValue}
              </Badge>
            );
          })
        }
      </div>
    </div>
  );
}

function handleWeaponDamageRolls(offense: WeaponOffense) : { total: number, rolls: [number, boolean][] }
{
  let totalOffenseDamage = 0;
  const rolls: [number, boolean][] = [];

  for (let i = 0; i < offense.amount; i++) 
  {
    const [damageWithoutCritical, criticalDamage] = handleWeaponDamageRoll(offense);
    const weaponDiceDamageWithoutCritical = damageWithoutCritical + offense.bonus;
    rolls.push([damageWithoutCritical, criticalDamage > 0]);
    totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
  }

  return { total: totalOffenseDamage, rolls };
};

function calculateWeaponDamageForRolls(offense: WeaponOffense, rolls: number[]) : number
{
  let totalOffenseDamage = 0;

  for (let i = 0; i < rolls.length; i++) 
  {
    const roll = rolls[i];
    const weaponDiceDamageWithoutCritical = roll + offense.bonus;
    const criticalDamage = handleCriticalDamage(offense, roll);
    totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
  }

  return totalOffenseDamage;
};

function handleWeaponDamageRoll(offense: WeaponOffense) : [damage: number, critical: number]
{
  const weaponDamageRoll = handleWeaponOffenseRoll(offense);
  const criticalDamage = handleCriticalDamage(offense, weaponDamageRoll);
  return [ weaponDamageRoll, criticalDamage ];
}

function handleDamageBonusRolls(damageOffense: DamageOffense)
{
  let totalDamageBonus = 0;
  const rolls: number[] = [];

  for (let i = 0; i < damageOffense.amount; i++) 
  {
    const damageBonusRoll = handleDamageOffenseRoll(damageOffense);
    rolls.push(damageBonusRoll);
    totalDamageBonus += damageBonusRoll;
  }

  return { total: totalDamageBonus + damageOffense.bonus, rolls };
}

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

function handleWeaponOffenseRoll(offense: WeaponOffense): number
{
  return Math.floor(Math.random() * offense.grade * 2) + 1;
}

function handleDamageOffenseRoll(damageOffense: DamageOffense): number
{
  return Math.floor(Math.random() * damageOffense.grade * 2) + 1;
}

function handleCriticalDamage(offense: WeaponOffense, roll: number): number
{
  return roll >= (offense.grade * 2 - offense.critical.range) ? offense.critical.power : 0;
}