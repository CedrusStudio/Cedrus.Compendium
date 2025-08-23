"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from "react";
import WeaponDamageCard from '@/components/character/combat/WeaponDamageCard';
import DamageBonusCard from './DamageBonusCard';

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
        <WeaponOffenseView leadingOffense={input.offense.leadingWeapon} secondaryOffense={input.offense.secondaryWeapon} damageBonus={input.offense.damageBonus} />
      </CardContent>
      
    </Card>
  );
};

function WeaponOffenseView({ leadingOffense, secondaryOffense, damageBonus }: { leadingOffense: WeaponOffense, secondaryOffense?: WeaponOffense, damageBonus: DamageOffense })
{
    const [rollResult, setRollResult] = useState<number | null>(null);

    const handleRoll = () => 
    {
        const weapons = [leadingOffense, secondaryOffense].filter(Boolean) as WeaponOffense[];

        const totalDamage = weapons.reduce
        (   
            (totalDamage, weapon) => totalDamage + Array
                .from({ length: weapon.amount }, () => calculateDamageRoll(weapon))
                .reduce((totalWeaponDamage, rollDamage) => totalWeaponDamage + rollDamage, 0), 
            calculateDamageBonusRoll(damageBonus)
        );

        setRollResult(totalDamage);
    };

    return (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>

            <WeaponDamageCard name='Leading Weapon' offense={leadingOffense} className='w-full' />
            { secondaryOffense && <WeaponDamageCard name='Secondary Weapon' offense={secondaryOffense} className='w-full' /> }
            <DamageBonusCard damageBonus={damageBonus} className='w-full' />

            <div className='flex flex-row gap-x-4 justify-center items-center'>
                <Button variant='outline' onClick={() => handleRoll()} className="w-32 grid grid-cols-12 gap-0">
                    <div className="col-span-10">Roll result:</div> 
                    <div className="col-span-2 text-start">{rollResult}</div>
                </Button>
            </div>
        </div>
    );
}

function calculateDamageRoll(leadingOffense: WeaponOffense) 
{
    let leadingWeaponDamageRoll = Math.floor(Math.random() * leadingOffense.grade * 2) + 1 + leadingOffense.bonus;

    if (leadingWeaponDamageRoll >= (leadingOffense.grade * 2 - leadingOffense.critical.range)) 
    {
        leadingWeaponDamageRoll += leadingOffense.critical.power;
    }

    return leadingWeaponDamageRoll;
}

function calculateDamageBonusRoll(damageOffense: DamageOffense) 
{
    return Math.floor(Math.random() * damageOffense.grade * 2) + 1 + damageOffense.bonus;
}
