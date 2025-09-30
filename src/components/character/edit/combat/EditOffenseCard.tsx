"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import Subcard from '@/components/global/Subcard';
import { Badge } from '@/components/ui/badge';
import VerticalChangeButtons from '@/components/buttons/VerticalChangeButtons';
import { useState } from 'react';

type EditOffenseCardProps =
{
    offense: Offense;
    control: Control<UpsertCharacterCombatType>;
}

export default function EditOffenseCard({ offense, control }: EditOffenseCardProps)
{
  const [leadingOffense, setLeadingOffense] = useState<WeaponOffense>(offense.leadingWeapon);
  const [secondaryOffense, setSecondaryOffense] = useState<WeaponOffense | undefined>(offense.secondaryWeapon);
  const [damageBonus, setDamageBonus] = useState<DamageOffense>(offense.damageBonus);

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>
          Offense
        </CardTitle>
      </CardHeader>

      <CardContent className={ `grid grid-cols-1 gap-1 ${offense.secondaryWeapon ? `md:grid-cols-9` : `md:grid-cols-6` }` }>

        <EditWeaponOffenseSubcard 
          name='Leading Arm' 
          offense={leadingOffense} 
          control={control} 
          resetCallback={() => setLeadingOffense(offense.leadingWeapon)}
          setPower={action => setLeadingOffense(prev => 
          {
            const nextPower = typeof action === "function" ? action(prev.critical.power) : action;
            return { ...prev, critical: { ...prev.critical, power: nextPower } };
          })}
          setRange={action => setLeadingOffense(prev => 
          {
            const nextRange = typeof action === "function" ? action(prev.critical.range) : action;
            if (nextRange < 0 || nextRange > prev.grade * 2) return prev;
            return { ...prev, critical: { ...prev.critical, range: nextRange } };
          })}
          setAmount={action => setLeadingOffense(prev => 
          {
            const nextAmount = typeof action === "function" ? action(prev.amount) : action;
            if (nextAmount < 0) return prev;
            return { ...prev, amount: nextAmount };
          })}
          setGrade={action => setLeadingOffense(prev => 
          {
            const nextGrade = typeof action === "function" ? action(prev.grade) : action;
            if (nextGrade < 1) return prev;
            return { ...prev, grade: nextGrade };
          })}
          setBonus={action => setLeadingOffense(prev => 
          {
            const nextBonus = typeof action === "function" ? action(prev.bonus) : action;
            return { ...prev, bonus: nextBonus };
          })}
        />
        
        { 
          offense.secondaryWeapon && <EditWeaponOffenseSubcard name='Secondary Arm' offense={secondaryOffense} control={control} />
        }

        <EditDamageBonusSubcard 
          damageOffense={damageBonus} 
          control={control} 
          resetCallback={() => setDamageBonus(offense.damageBonus)}
          setAmount={action => setDamageBonus(prev => 
          {
            const nextAmount = typeof action === "function" ? action(prev.amount) : action;
            if (nextAmount < 0) return prev;

            return { ...prev, amount: nextAmount };
          })}
          setGrade={action => setDamageBonus(prev => 
          {
            const nextGrade = typeof action === "function" ? action(prev.grade) : action;
            if (nextGrade < 1) return prev;
            return { ...prev, grade: nextGrade };
          })}
          setBonus={action => setDamageBonus(prev => 
          {
            const nextBonus = typeof action === "function" ? action(prev.bonus) : action;
            return { ...prev, bonus: nextBonus };
          })}
        />

      </CardContent>
      
    </Card>
  );
};

type EditWeaponOffenseSubcardProps =
{
  name: string;
  offense: WeaponOffense;
  control: Control<UpsertCharacterCombatType>;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  resetCallback: () => void;
};

function EditWeaponOffenseSubcard({ name, offense, control, setAmount, setGrade, setBonus, setPower, setRange, resetCallback }: EditWeaponOffenseSubcardProps)
{
  return (
    <Subcard name={name} className='col-span-3' callback={resetCallback}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditWeaponDamageView weaponOffense={offense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
        </div>
        <EditCriticalView weaponOffense={offense} setPower={setPower} setRange={setRange} />
      </div>
    </Subcard>
  );
}

type EditWeaponDamageViewProps =
{
  weaponOffense: WeaponOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
}

function EditWeaponDamageView({ weaponOffense, setAmount, setGrade, setBonus }: EditWeaponDamageViewProps) 
{
  return (
    <div className='flex gap-x-1'>

      <div className='flex items-center'>
        <VerticalChangeButtons setValue={setAmount} />
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
          {weaponOffense.amount}(k{weaponOffense.grade * 2}+{weaponOffense.bonus})
        </Badge>

        <VerticalChangeButtons setValue={setGrade} />
        <VerticalChangeButtons setValue={setBonus} />
      </div>
        
    </div>
  );
}

type EditCriticalViewProps = 
{
  weaponOffense: WeaponOffense;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
};

function EditCriticalView({ weaponOffense, setRange, setPower }: EditCriticalViewProps) 
{
  const calculatedRange = `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;

  return (
    <div className='flex gap-x-1'>

        <div className='flex items-center'>
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
                {calculatedRange}
            </Badge>
            <VerticalChangeButtons setValue={setRange} />
        </div>
        
        <div  className='flex items-center'>
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">
                {weaponOffense.critical.power > 0 ? '+' : ''}{weaponOffense.critical.power}
            </Badge>
            <VerticalChangeButtons setValue={setPower} />
        </div>
        
    </div>
  );
}

// -----------------------------------------------------------------

type EditDamageBonusSubcardProps =
{
  damageOffense: DamageOffense;
  control: Control<UpsertCharacterCombatType>;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  resetCallback: () => void;
}

function EditDamageBonusSubcard({ damageOffense, control, setAmount, setGrade, setBonus, resetCallback }: EditDamageBonusSubcardProps)
{
  return (
    <Subcard name={"Damage Bonus"} className='col-span-3' callback={resetCallback}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditDamageBonusView damageOffense={damageOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
        </div>
      </div>
    </Subcard>
  );
}

type EditDamageBonusViewProps =
{
  damageOffense: DamageOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
}

function EditDamageBonusView({ damageOffense, setAmount, setGrade, setBonus }: EditDamageBonusViewProps) 
{
  return (
    <div className='flex gap-x-1'>

      <div className='flex items-center'>
        <VerticalChangeButtons setValue={setAmount} />
          <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
            {damageOffense.amount}k{damageOffense.grade * 2}+{damageOffense.bonus}
          </Badge>
        <VerticalChangeButtons setValue={setGrade} />
        <VerticalChangeButtons setValue={setBonus} />
      </div>
        
    </div>
  );
}