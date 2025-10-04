"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/Character';
import { defaultWeaponOffense } from '@/domain/data/defaults';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, useController } from "react-hook-form";
import Subcard from '@/components/global/Subcard';
import { Badge } from '@/components/ui/badge';
import VerticalChangeButtons from '@/components/buttons/VerticalChangeButtons';
import { PathsFrom } from '@/utils/global/pathTypes';
import { useDamageOffenseForm } from '@/components/character/edit/combat/useDamageOffenseForm';
import { useWeaponOffenseForm } from '@/components/character/edit/combat/useWeaponOffenseForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import RemoveButton from '@/components/ui/RemoveButton';
import { LuPlus } from 'react-icons/lu';

type StatsRoot = Pick<UpsertCharacterCombatType, "offense">;
export type WeaponOffensePath = PathsFrom<StatsRoot, WeaponOffense | undefined>;
export type DamageOffensePath = Exclude<PathsFrom<StatsRoot, DamageOffense>, WeaponOffensePath>;

type EditOffenseCardProps =
{
  offense: Offense;
  control: Control<UpsertCharacterCombatType>;
}

export default function EditOffenseCard({ offense, control }: EditOffenseCardProps)
{
  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>
          Ofensywa
        </CardTitle>
      </CardHeader>

      <CardContent className={ 'grid grid-cols-1 gap-1 md:grid-cols-9' }>
        <EditLeadingWeaponOffenseSubcard offense={offense} control={control}/>
        <EditSecondaryWeaponOffenseSubcard offense={offense} control={control} />
        <EditDamageBonusSubcard defaultDamageOffense={offense.damageBonus} control={control} />
      </CardContent>
      
    </Card>
  );
};

type EditLeadingWeaponOffenseSubcardProps =
{
  offense: Offense;
  control: Control<UpsertCharacterCombatType>;
};

function EditLeadingWeaponOffenseSubcard({ offense, control }: EditLeadingWeaponOffenseSubcardProps)
{
  const weaponOffensePath = 'offense.leadingWeapon' as WeaponOffensePath;
  const { power, setPower, range, setRange, amount, setAmount, grade, setGrade, bonus, setBonus, resetAll } = useWeaponOffenseForm(control, weaponOffensePath, offense.leadingWeapon);
  const weaponOffense = { amount, grade, bonus, critical: { power, range } };

  return (
    <Subcard name='Wiodąca' className='col-span-3' callback={resetAll}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditWeaponDamageView weaponOffense={weaponOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
        </div>
        <EditCriticalView weaponOffense={weaponOffense} setPower={setPower} setRange={setRange} />
      </div>
    </Subcard>
  );
}

type EditSecondaryWeaponOffenseSubcardProps =
{
  offense: Offense;
  control: Control<UpsertCharacterCombatType>;
};

function EditSecondaryWeaponOffenseSubcard({ control, offense }: EditSecondaryWeaponOffenseSubcardProps)
{
  const secondaryOffenseExists = offense.secondaryWeapon !== undefined;
  const [showSecondary, setShowSecondary] = useState(secondaryOffenseExists);
  const weaponOffensePath = 'offense.secondaryWeapon' as WeaponOffensePath;

  const { field } = useController
  ({
    name: weaponOffensePath,
    control,
    defaultValue: offense.secondaryWeapon
  });

  const weaponOffenseToUse = field.value || defaultWeaponOffense;
  const { power, setPower, range, setRange, amount, setAmount, grade, setGrade, bonus, setBonus, resetAll } = useWeaponOffenseForm(control, weaponOffensePath, weaponOffenseToUse);

  const handleAddSecondary = () => 
  {
    field.onChange(defaultWeaponOffense);
    setShowSecondary(true);
  };

  if (!showSecondary || !field.value) 
  {
    return (
      <Card className="flex items-center justify-center col-span-3 bg-secondary">
        <CardContent className='flex items-center justify-center'>
          <Button variant='outline' onClick={handleAddSecondary}><LuPlus className="h-[1.2rem] w-[1.2rem]" /></Button>
        </CardContent>
    </Card>
    );
  }

  const newOffense = { amount, grade, bonus, critical: { power, range } };
  const removeButton = <RemoveButton name={weaponOffensePath} variant={`${secondaryOffenseExists ? 'destructive' : 'outline'}`} control={control} callback={() => setShowSecondary(false)} />;

  return (
    <Subcard name="Wtórna" className={`col-span-3 ${secondaryOffenseExists ? '' : 'bg-secondary'} `} callback={resetAll} button={removeButton}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditWeaponDamageView weaponOffense={newOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
        </div>
        <EditCriticalView weaponOffense={newOffense} setPower={setPower} setRange={setRange} />
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
        
        <div className='flex items-center'>
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
  defaultDamageOffense: DamageOffense;
  control: Control<UpsertCharacterCombatType>;
}

function EditDamageBonusSubcard({ defaultDamageOffense, control }: EditDamageBonusSubcardProps)
{
  const { amount, bonus, grade, resetAll, setAmount, setBonus, setGrade } = useDamageOffenseForm(control, `offense.damageBonus`, defaultDamageOffense);
  const damageOffense = { amount, grade, bonus };

  return (
    <Subcard name={"Bonus"} className='col-span-3' callback={resetAll}>
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