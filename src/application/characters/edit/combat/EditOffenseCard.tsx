"use client";

import { DamageOffense, damageOffenseField, leadingOffenseField, Offense, secondaryOffenseField, WeaponOffense, pathToOffenseField } from '@/domain/characters/Character';
import { CreateWeaponOffense } from '@/domain/data/defaults';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { useController, useFormContext } from "react-hook-form";
import Subcard from '@/common/components/Subcard';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import { useDamageOffenseForm } from '@/application/characters/edit/combat/useDamageOffenseForm';
import { useWeaponOffenseForm } from '@/application/characters/edit/combat/useWeaponOffenseForm';
import { Button } from '@/ui/button';
import { useState } from 'react';
import RemoveButton from '@/ui/RemoveButton';
import { LuPlus } from 'react-icons/lu';
import { resolveSetState } from '@/common/global/resolveSetState';
import { translate } from '@/domain/data/translations';
import { InputFormField } from '@/common/components/ui/InputFormField';
import AreaInputFormField from '@/common/components/ui/AreaInputFormField';

type EditOffenseCardProps =
{
  offense: Offense;
  index: number;
}

export default function EditOffenseCard({ offense, index }: EditOffenseCardProps)
{
  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary mb-6 flex items-center justify-center gap-6'>
          {translate('offense')}
          
          <div key="name" className={"flex flex-col items-center gap-2"}>
            <InputFormField<UpsertCharacterCombatType> path={pathToOffenseField(index, 'name')} inputClassName='w-60 h-10 text-center font-medium' />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-6 -mt-8'>

        <AreaInputFormField<UpsertCharacterCombatType> 
          path={pathToOffenseField(index, 'description')}
          inputPlaceholder="zmien opis..." 
        />

        <div className='grid grid-cols-1 gap-1 md:grid-cols-9'>
          <EditLeadingWeaponOffenseSubcard offense={offense} index={index} />
          <EditSecondaryWeaponOffenseSubcard offense={offense} index={index} />
          <EditDamageBonusSubcard defaultDamageOffense={offense.damageBonus} index={index} />
        </div>
      </CardContent>
      
    </Card>
  );
};

type EditLeadingWeaponOffenseSubcardProps =
{
  offense: Offense;
  index: number;
};

function EditLeadingWeaponOffenseSubcard({ offense, index }: EditLeadingWeaponOffenseSubcardProps)
{
  const weaponOffensePath = leadingOffenseField(index);
  const { control } = useFormContext<UpsertCharacterCombatType>();
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
  index: number;
};

function EditSecondaryWeaponOffenseSubcard({ offense, index }: EditSecondaryWeaponOffenseSubcardProps)
{
  const secondaryOffenseExists = offense.secondaryWeapon !== undefined;
  const [showSecondary, setShowSecondary] = useState(secondaryOffenseExists);
  const weaponOffensePath = secondaryOffenseField(index);
  const { control } = useFormContext<UpsertCharacterCombatType>();

  const { field } = useController
  ({
    name: weaponOffensePath,
    control,
    defaultValue: offense.secondaryWeapon
  });

  const updateField = (updater: (current: WeaponOffense) => WeaponOffense) => field.onChange(updater(field.value ?? CreateWeaponOffense()));

  const { power, setPower, range, setRange, amount, setAmount, grade, setGrade, bonus, setBonus, resetAll } = 
  {
    power: field.value?.critical.power,
    setPower: (val: React.SetStateAction<number>) => updateField(current => ({...current, critical: { ...current.critical, power: resolveSetState(val, current.critical.power) }})),
    
    range: field.value?.critical.range,
    setRange: (val: React.SetStateAction<number>) => updateField(current => ({...current, critical: { ...current.critical, range: resolveSetState(val, current.critical.range) }})),

    amount: field.value?.amount,
    setAmount: (val: React.SetStateAction<number>) => updateField(current => ({...current, amount: resolveSetState(val, current.amount) })),
    
    grade: field.value?.grade,
    setGrade: (val: React.SetStateAction<number>) => updateField(current => ({...current, grade: resolveSetState(val, current.grade) })),
    
    bonus: field.value?.bonus,
    setBonus: (val: React.SetStateAction<number>) =>  updateField(current => ({...current, bonus: resolveSetState(val, current.bonus) })),
    
    resetAll: () => field.onChange(offense.secondaryWeapon ?? CreateWeaponOffense())
  };

  const handleAddSecondary = () => 
  {
    field.onChange(CreateWeaponOffense());
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

  const newOffense = { amount, grade, bonus, critical: { power, range } } as WeaponOffense;
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
  index: number;
}

function EditDamageBonusSubcard({ defaultDamageOffense, index }: EditDamageBonusSubcardProps)
{
  const { control } = useFormContext<UpsertCharacterCombatType>();
  const { amount, bonus, grade, resetAll, setAmount, setBonus, setGrade } = useDamageOffenseForm(control, damageOffenseField(index), defaultDamageOffense);
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