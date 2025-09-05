"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from "react";
import DamageBonusView from '@/components/character/combat/DamageBonusView';
import RollButton from "@/components/character/RollButton";
import Subcard from '@/components/global/Subcard';
import WeaponDamageView from '@/components/character/combat/WeaponDamageCard';
import CriticalView from './CriticalView';
import { GiRollingDices } from "react-icons/gi";
import { Badge } from '@/components/ui/badge';

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

    const handleRoll = () => 
    {
        setRollTotalResult(null);
        setLeadingRolls([]);
        setSecondaryRolls([]);
        setDamageBonusRolls([]);

        const { total: damageBonusTotal, rolls: damageBonusRolls } = handleDamageBonusRolls(damageBonus);
        const { total: leadingTotal, rolls: leadingRolls } = handleWeaponDamageRolls(leadingOffense);
        const { total: secondaryTotal, rolls: secondaryRolls } = secondaryOffense ? handleWeaponDamageRolls(secondaryOffense) : { total: 0, rolls: [] };

        setDamageBonusRolls(damageBonusRolls);
        setLeadingRolls(leadingRolls);
        setSecondaryRolls(secondaryRolls);

        const totalDamage = damageBonusTotal + leadingTotal + secondaryTotal;
        setRollTotalResult(totalDamage);
    };

    return (
        <div className={ `grid grid-cols-1 gap-4 ${secondaryOffense ? `md:grid-cols-10` : `md:grid-cols-7` }` }>

            <Subcard className='col-span-3' name='Leading Arm' innerCardContent={<WeaponDamageWithCriticalAndRolls weaponOffense={leadingOffense} rolls={leadingRolls} />} />
            { secondaryOffense && <Subcard className='col-span-3' name='Secondary Arm' innerCardContent={<WeaponDamageWithCriticalAndRolls weaponOffense={secondaryOffense} rolls={secondaryRolls} />} /> }
            <Subcard name='Damage Bonus' className='col-span-3 w-full' innerCardContent={<DamageBonusWithRolls damageOffense={damageBonus} rolls={damageBonusRolls} />} />

            <div className='flex justify-center items-center col-span-1'>
              <RollButton onClick={handleRoll} rollResult={rollTotalResult} />
            </div>
        </div>
    );
}

function WeaponDamageWithCriticalAndRolls({ weaponOffense, rolls }: { weaponOffense: WeaponOffense, rolls: [number, boolean][] })
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex justify-center gap-x-3'>
        <WeaponDamageView weaponOffense={weaponOffense} />
        <CriticalView weaponOffense={weaponOffense} />
      </div>
      <RollsView rolls={rolls} />
    </div>
  )
};

function DamageBonusWithRolls({ damageOffense, rolls }: { damageOffense: DamageOffense, rolls: number[] })
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex justify-center gap-x-3'>
        <DamageBonusView damageOffense={damageOffense} />
      </div>
      <RollsView rolls={rolls} />
    </div>
  )
};

function RollsView<T extends number | [number, boolean]>({ rolls }: { rolls: T[] }) 
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
                className={`rounded-full px-1 font-mono inline ${isCritical ? 'bg-yellow-300' : ''}`}
              >
                <div className='flex items-center gap-x-1'>
                    <GiRollingDices />
                  {rollValue}
                </div>
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
      const weaponDamageRoll = Math.floor(Math.random() * offense.grade * 2) + 1;
      const weaponDiceDamageWithoutCritical = weaponDamageRoll + offense.bonus;
      const criticalDamage = weaponDamageRoll >= (offense.grade * 2 - offense.critical.range) ? offense.critical.power : 0;
      rolls.push([weaponDamageRoll, criticalDamage > 0]);
      totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
    }

    return { total: totalOffenseDamage, rolls };
};

function handleDamageBonusRolls(damageOffense: DamageOffense)
{
    let totalDamageBonus = 0;
    const rolls: number[] = [];

    for (let i = 0; i < damageOffense.amount; i++) 
    {
      const damageBonusRoll = Math.floor(Math.random() * damageOffense.grade * 2) + 1;
      rolls.push(damageBonusRoll);
      totalDamageBonus += damageBonusRoll;
    }

    return { total: totalDamageBonus + damageOffense.bonus, rolls };
}
