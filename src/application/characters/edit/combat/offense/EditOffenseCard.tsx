"use client";

import { Offense, DamageOffense, damageOffenseField, leadingOffenseField, secondaryOffenseField, WeaponOffense, pathToOffenseField, CreateWeaponOffense, additionalDamageOffenseField, CreateDamageOffense } from '@/domain/characters/combat/Offense';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { useController, UseFieldArrayRemove, useFormContext } from "react-hook-form";
import Subcard from '@/common/components/Subcard';
import { useDamageOffenseForm } from '@/application/characters/edit/combat/useDamageOffenseForm';
import { useWeaponOffenseForm } from '@/application/characters/edit/combat/useWeaponOffenseForm';
import { Button } from '@/ui/button';
import { useState } from 'react';
import RemoveButton from '@/common/components/form/RemoveButton';
import { resolveSetState } from '@/common/global/resolveSetState';
import { InputFormField } from '@/common/components/form/InputFormField';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { addIcon } from '@/common/icons';
import { displayedText } from '@/common/translations';
import EditWeaponDamageView from '@/application/characters/edit/combat/offense/EditWeaponDamageView';
import EditDamageBonusView from '@/application/characters/edit/combat/offense/EditDamageBonusView';
import EditCriticalView from '@/application/characters/edit/combat/offense/EditCriticalView';
import DefaultCombatSetButton from '../DefaultCombatSetButton';

type EditOffenseCardProps =
{
  offense: Offense;
  index: number;
  remove: UseFieldArrayRemove;
}

export default function EditOffenseCard({ offense, index, remove }: EditOffenseCardProps)
{
  const { watch, setValue } = useFormContext<CombatDto>();
  const defaultOffenseId = watch('defaultOffenseId');
  const actualOffenseId = watch(`offenses.${index}.id`);
  const isDefault = defaultOffenseId === actualOffenseId;

  const handleSetAsDefault = () => {
    setValue('defaultOffenseId', actualOffenseId);
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='mb-6 flex flex-wrap gap-3 justify-between items-center'>
          <InputFormField<CombatDto> path={pathToOffenseField(index, 'name')} inputClassName='w-50 sm:w-60 h-10 text-center font-medium' />
          <div className='flex gap-2'>
            <DefaultCombatSetButton selected={isDefault} onSelect={handleSetAsDefault} />
            <RemoveFromArrayButton index={index} remove={remove} />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-6 -mt-8'>

        <AreaInputFormField<CombatDto> 
          path={pathToOffenseField(index, 'description')}
          inputPlaceholder={displayedText.changeDescription}
        />

        <div className='grid grid-cols-1 gap-1 lg:grid-cols-9'>
          <EditLeadingWeaponOffenseSubcard offense={offense} index={index} />
          <EditSecondaryWeaponOffenseSubcard offense={offense} index={index} />
          <EditDamageBonusSubcard defaultDamageOffense={offense.damageBonus} index={index} />
          <EditAdditionalDamageBonusSubcard defaultAdditionalDamageOffense={offense.additionalDamageBonus} index={index} />
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
  const { control } = useFormContext<CombatDto>();
  const { power, setPower, range, setRange, amount, setAmount, grade, setGrade, bonus, setBonus, isPhantom, setIsPhantom, resetAll } = useWeaponOffenseForm(control, weaponOffensePath, offense.leadingWeapon);
  const weaponOffense = { amount, grade, bonus, critical: { power, range }, isPhantom };

  return (
    <Subcard name={displayedText.leading} className='col-span-3' callback={resetAll}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditWeaponDamageView weaponOffense={weaponOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} setIsPhantom={setIsPhantom} />
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
  const { control } = useFormContext<CombatDto>();

  const { field } = useController
  ({
    name: weaponOffensePath,
    control,
    defaultValue: offense.secondaryWeapon
  });

  const updateField = (updater: (current: WeaponOffense) => WeaponOffense) => field.onChange(updater(field.value ?? CreateWeaponOffense()));

  const { power, setPower, range, setRange, amount, setAmount, grade, setGrade, bonus, setBonus, isPhantom, setIsPhantom, resetAll } = 
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

    isPhantom: field.value?.isPhantom,
    setIsPhantom: (val: React.SetStateAction<boolean>) => updateField(current => ({...current, isPhantom: resolveSetState(val, current.isPhantom) })),

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
          <Button variant='outline' onClick={handleAddSecondary}>{addIcon("h-[1.2rem] w-[1.2rem]")}</Button>
        </CardContent>
    </Card>
    );
  }

  const newOffense = { amount, grade, bonus, critical: { power, range }, isPhantom } as WeaponOffense;
  const removeButton = <RemoveButton name={weaponOffensePath} variant={`${secondaryOffenseExists ? 'destructive' : 'outline'}`} control={control} callback={() => setShowSecondary(false)} />;

  return (
    <Subcard name={displayedText.secondary} className={`col-span-3 ${secondaryOffenseExists ? '' : 'bg-secondary'} `} callback={resetAll} button={removeButton}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditWeaponDamageView weaponOffense={newOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} setIsPhantom={setIsPhantom} />
        </div>
        <EditCriticalView weaponOffense={newOffense} setPower={setPower} setRange={setRange} />
      </div>
    </Subcard>
  );
}

type EditDamageBonusSubcardProps =
{
  defaultDamageOffense: DamageOffense;
  index: number;
}

function EditDamageBonusSubcard({ defaultDamageOffense, index }: EditDamageBonusSubcardProps)
{
  const { control } = useFormContext<CombatDto>();
  const { amount, bonus, grade, isPhantom, resetAll, setAmount, setBonus, setGrade, setIsPhantom } = useDamageOffenseForm(control, damageOffenseField(index), defaultDamageOffense);
  const damageOffense = { amount, grade, bonus, isPhantom };

  return (
    <Subcard name={displayedText.bonus} className='col-span-3 capitalize' callback={resetAll}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditDamageBonusView damageOffense={damageOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} setIsPhantom={setIsPhantom} />
        </div>
      </div>
    </Subcard>
  );
}

type EditAdditionalDamageBonusSubcardProps =
{
  defaultAdditionalDamageOffense: DamageOffense | undefined;
  index: number;
}

function EditAdditionalDamageBonusSubcard({ defaultAdditionalDamageOffense, index }: EditAdditionalDamageBonusSubcardProps)
{
  const additionalDamageOffenseExists = defaultAdditionalDamageOffense !== undefined;
  const [showAdditionalDamage, setShowAdditionalDamage] = useState(additionalDamageOffenseExists);
  const additionalDamageOffensePath = additionalDamageOffenseField(index);
  const { control } = useFormContext<CombatDto>();

  const { field } = useController
  ({
    name: additionalDamageOffensePath,
    control,
    defaultValue: defaultAdditionalDamageOffense
  });

  const updateField = (updater: (current: DamageOffense) => DamageOffense) => field.onChange(updater(field.value ?? CreateDamageOffense()));

  const { amount, setAmount, grade, setGrade, bonus, setBonus, isPhantom, setIsPhantom, resetAll } = 
  {
    amount: field.value?.amount,
    setAmount: (val: React.SetStateAction<number>) => updateField(current => ({...current, amount: resolveSetState(val, current.amount) })),
    
    grade: field.value?.grade,
    setGrade: (val: React.SetStateAction<number>) => updateField(current => ({...current, grade: resolveSetState(val, current.grade) })),
    
    bonus: field.value?.bonus,
    setBonus: (val: React.SetStateAction<number>) =>  updateField(current => ({...current, bonus: resolveSetState(val, current.bonus) })),

    isPhantom: field.value?.isPhantom,
    setIsPhantom: (val: React.SetStateAction<boolean>) => updateField(current => ({...current, isPhantom: resolveSetState(val, current.isPhantom) })),

    resetAll: () => field.onChange(defaultAdditionalDamageOffense ?? CreateDamageOffense())
  };

  const handleAddAdditionalDamageOffense = () => 
  {
    field.onChange(CreateDamageOffense());
    setShowAdditionalDamage(true);
  };

  if (!showAdditionalDamage || !field.value)
  {
    return (
      <Card className="flex items-center justify-center col-span-3 bg-secondary">
        <CardContent className='flex items-center justify-center'>
          <Button variant='outline' onClick={handleAddAdditionalDamageOffense}>{addIcon("h-[1.2rem] w-[1.2rem]")}</Button>
        </CardContent>
    </Card>
    );
  }

  const newOffense = { amount, grade, bonus, isPhantom } as DamageOffense;
  const removeButton = <RemoveButton name={additionalDamageOffensePath} variant={`${additionalDamageOffenseExists ? 'destructive' : 'outline'}`} control={control} callback={() => setShowAdditionalDamage(false)} />;

  return (
    <Subcard name={displayedText.bonus} className='col-span-3 capitalize' callback={resetAll} button={removeButton}>
      <div className='flex flex-col items-center gap-y-3'>
        <div className='flex justify-center gap-x-3'>
          <EditDamageBonusView damageOffense={newOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} setIsPhantom={setIsPhantom} />
        </div>
      </div>
    </Subcard>
  );
}
