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

    const leadingWeaponCriticalRange = calculateWeaponCriticalRangeView(leadingOffense);
    const leadingWeaponDamage = calculateWeaponDamageView(leadingOffense);

    const secondaryWeaponCriticalRange = secondaryOffense ? calculateWeaponCriticalRangeView(secondaryOffense) : null;
    const secondaryWeaponDamage = secondaryOffense ? calculateWeaponDamageView(secondaryOffense) : null;

    const bonusDamage = `${damageBonus.amount}k${damageBonus.grade * 2}+${damageBonus.bonus}`;

    const handleRoll = () => 
    {
        let totalDamage: number = 0;

        for (let i = 0; i < leadingOffense.amount; i++) 
        {
            totalDamage += calculateDamageRoll(leadingOffense);
        }

        if (secondaryOffense)
        {
            totalDamage += calculateDamageRoll(secondaryOffense);
        }

        const bonusDamageRoll = Math.floor(Math.random() * damageBonus.grade * 2) + 1 + damageBonus.bonus;
        totalDamage += bonusDamageRoll;
        setRollResult(totalDamage);
    };

    return (
        <div className='flex flex-row justify-around'>
            <div className='flex flex-row gap-x-4'>
                {
                    secondaryWeaponDamage 
                        ? <div>{leadingWeaponDamage}+{secondaryWeaponDamage}+{bonusDamage}</div>
                        : <div>{leadingWeaponDamage}+{bonusDamage}</div>
                }
                <div>{leadingWeaponCriticalRange}</div>
                <div>+{leadingOffense.critical.power}</div>
                {
                    secondaryWeaponDamage && <div><div>{secondaryWeaponCriticalRange}    +{secondaryOffense?.critical.power}</div></div>
                }
            </div>

            <div className='flex flex-row gap-x-4'>
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

function calculateWeaponDamageView(weaponOffense: WeaponOffense)
{
    return `${weaponOffense.amount}(k${weaponOffense.grade * 2}+${weaponOffense.bonus})`;
}

function calculateWeaponCriticalRangeView(weaponOffense: WeaponOffense)
{
    return `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;
}