"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import DamageBonusView from '@/components/character/combat/DamageBonusView';
import RollButton from "@/components/character/RollButton";
import Subcard from '@/components/global/Subcard';
import WeaponDamageView from '@/components/character/combat/WeaponDamageCard';
import CriticalView from '@/components/character/combat/CriticalView';
import { GiRollingDices } from "react-icons/gi";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type OffenseCardProps = 
{
  offense: Offense;
};

export default function OffenseCard(input: OffenseCardProps)
{
  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Offense</CardTitle>
      </CardHeader>

      <CardContent>
        <OffenseView leadingOffense={input.offense.leadingWeapon} secondaryOffense={input.offense.secondaryWeapon} damageBonus={input.offense.damageBonus} />
      </CardContent>
      
    </Card>
  );
};

function OffenseView({ leadingOffense, secondaryOffense, damageBonus }: { leadingOffense: WeaponOffense, secondaryOffense?: WeaponOffense, damageBonus: DamageOffense })
{
    const [leadingRolls, setLeadingRolls] = useState<[number, boolean][]>([]);
    const [secondaryRolls, setSecondaryRolls] = useState<[number, boolean][]>([]);
    const [damageBonusRolls, setDamageBonusRolls] = useState<number[]>([]);
    const [rollTotalResult, setRollTotalResult] = useState<number | null>(null);

    useEffect(() => 
    {
        const shouldNotRecalculateTotalDamage = leadingRolls.length === 0 && secondaryRolls.length === 0 && damageBonusRolls.length === 0;
        if (shouldNotRecalculateTotalDamage)
        {
            setRollTotalResult(null);
            return;
        }

        const damageBonusTotal = calculateDamageBonusForRolls(damageBonus, damageBonusRolls);
        const leadingTotal = calculateWeaponDamageForRolls(leadingOffense, leadingRolls.map(r => r[0]));
        const secondaryTotal = secondaryOffense ? calculateWeaponDamageForRolls(secondaryOffense, secondaryRolls.map(r => r[0])) : 0;
        const totalDamage = damageBonusTotal + leadingTotal + secondaryTotal;
        setRollTotalResult(totalDamage);
    }, [leadingRolls, secondaryRolls, damageBonusRolls, leadingOffense, secondaryOffense, damageBonus]);

    const handleRoll = () => 
    {
        const { total: damageBonusTotal, rolls: damageBonusRolls } = handleDamageBonusRolls(damageBonus);
        const { total: leadingTotal, rolls: leadingRolls } = handleWeaponDamageRolls(leadingOffense);
        const { total: secondaryTotal, rolls: secondaryRolls } = secondaryOffense ? handleWeaponDamageRolls(secondaryOffense) : { total: 0, rolls: [] };

        setDamageBonusRolls(damageBonusRolls);
        setLeadingRolls(leadingRolls);
        setSecondaryRolls(secondaryRolls);

        const totalDamage = damageBonusTotal + leadingTotal + secondaryTotal;
        setRollTotalResult(totalDamage);
    };

    const handleWeaponReroll = (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => 
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

    return (
        <div className={ `grid grid-cols-1 gap-4 ${secondaryOffense ? `md:grid-cols-10` : `md:grid-cols-7` }` }>

            <Subcard 
              className='col-span-3' 
              name='Leading Arm' 
              innerCardContent=
              {
                <WeaponDamageWithCriticalAndRolls 
                  weaponOffense={leadingOffense} 
                  rolls={leadingRolls} 
                  onReroll={(index: number, offense: WeaponOffense) => handleWeaponReroll(index, offense, setLeadingRolls)}
                />
              } 
            />
            
            { 
              secondaryOffense && (
                <Subcard 
                  className='col-span-3' 
                  name='Secondary Arm' 
                  innerCardContent=
                  {
                    <WeaponDamageWithCriticalAndRolls 
                      weaponOffense={secondaryOffense} 
                      rolls={secondaryRolls} 
                      onReroll={(index: number, offense: WeaponOffense) => handleWeaponReroll(index, offense, setSecondaryRolls)}
                    />
                  } 
                />) 
            }

            <Subcard 
              name='Damage Bonus' 
              className='col-span-3 w-full' 
              innerCardContent=
              {
                <DamageBonusWithRolls 
                  damageOffense={damageBonus} 
                  rolls={damageBonusRolls} 
                  onReroll={(index: number, damageBonus: DamageOffense) => handleDamageBonusReroll(index, damageBonus, setDamageBonusRolls)}
                />
              } 
            />

            <div className='flex justify-center items-center col-span-1'>
              <RollButton onClick={handleRoll} rollResult={rollTotalResult} />
            </div>
        </div>
    );
}

function WeaponDamageWithCriticalAndRolls({ weaponOffense, rolls, onReroll }: { weaponOffense: WeaponOffense, rolls: [number, boolean][], onReroll: (index: number, offense: WeaponOffense) => void  })
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex justify-center gap-x-3'>
        <WeaponDamageView weaponOffense={weaponOffense} />
        <CriticalView weaponOffense={weaponOffense} />
      </div>
      <RollsView rolls={rolls} onReroll={(index) => onReroll(index, weaponOffense)} />
    </div>
  )
};

function DamageBonusWithRolls({ damageOffense, rolls, onReroll }: { damageOffense: DamageOffense, rolls: number[], onReroll: (index: number, damageBonus: DamageOffense) => void  })
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex justify-center gap-x-3'>
        <DamageBonusView damageOffense={damageOffense} />
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
                  <Button asChild variant="ghost" className="h-full w-full p-0" onClick={() => onReroll(index)}>
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