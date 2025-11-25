"use client";

import { toCriticalRangeString, DamageOffense, toOffenseString, Offense, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Dispatch, SetStateAction, useState } from "react";
import DamageBonusView from '@/application/characters/combat/DamageBonusView';
import RollButton from "@/common/components/buttons/RollButton";
import Subcard from '@/common/components/Subcard';
import WeaponDamageView from '@/application/characters/combat/WeaponDamageCard';
import CriticalView from '@/application/characters/combat/CriticalView';
import { GiRollingDices } from "react-icons/gi";
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import SelectOneOf from '@/common/components/selects/SelectOneOf';
import { resolveSetState } from '@/common/global/resolveSetState';
import { displayedText } from '@/presentation/translations';
import { useCombatRolls } from '@/application/characters/combat/useCombatRolls';
import { setWithSideEffect } from '@/common/global/setterUtils';

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

  const { 
    totalResult,
    handleRoll, 
    handleWeaponReroll, 
    handleDamageOffenseReroll,
    leadingRolls,
    setLeadingRolls,
    secondaryRolls,
    setSecondaryRolls,
    damageBonusRolls,
    setDamageBonusRolls,
    currentLeadingOffense,
    setCurrentLeadingOffense,
    currentSecondaryOffense,
    setCurrentSecondaryOffense,
    currentDamageBonus,
    setCurrentDamageBonus,
  } = useCombatRolls(selectedOffense);

  const handleChangeOffense = (index: number) =>
  {
    setCurrentLeadingOffense(offenses[index].leadingWeapon);
    setCurrentSecondaryOffense(offenses[index].secondaryWeapon);
    setCurrentDamageBonus(offenses[index].damageBonus);
    setLeadingRolls([]);
    setSecondaryRolls([]);
    setDamageBonusRolls([]);
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>
          <div className='flex flex-col sm:flex-row justify-center items-center gap-4'>
            <div className='flex flex-row gap-x-4 items-center justify-center'>
              <span className='capitalize'>{displayedText.offense}</span>
              <RollButton onClick={handleRoll} rollResult={totalResult()} />
            </div>
            <div className='flex flex-row items-center justify-center gap-4'>
              <SelectOneOf name='defense' defaultValue='0' index={selectedOffenseIndex} items={offenses} setIndex={setWithSideEffect(setSelectedOffenseIndex, handleChangeOffense)} />
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className={ `grid grid-cols-1 gap-1 ${currentSecondaryOffense ? `lg:grid-cols-9` : `lg:grid-cols-6` }` }>

        <WeaponDamageWithCriticalSubcard 
          name={displayedText.leading}
          weaponOffense={currentLeadingOffense}
          baseWeaponOffense={leadingOffense}
          rolls={leadingRolls}
          setRolls={setLeadingRolls}
          setOffense={setCurrentLeadingOffense}
          handleWeaponReroll={handleWeaponReroll}
          resetCallback={() => setCurrentLeadingOffense(leadingOffense)}
        />
            
        {
          currentSecondaryOffense && (
            <WeaponDamageWithCriticalSubcard 
              name={displayedText.secondary}
              weaponOffense={currentSecondaryOffense}
              baseWeaponOffense={secondaryOffense as WeaponOffense}
              rolls={secondaryRolls}
              setRolls={setSecondaryRolls}
              setOffense={weaponOffense => setCurrentSecondaryOffense(weaponOffense as WeaponOffense)}
              handleWeaponReroll={handleWeaponReroll}
              resetCallback={() => setCurrentSecondaryOffense(secondaryOffense)}
            />
          ) 
        }

        <Subcard name='Bonus' className='col-span-3' callback={() => setCurrentDamageBonus(damageBonus)} childrenInfo={<span>{toOffenseString(damageBonus)}</span> } > 
          <DamageBonusWithRolls 
            damageOffense={currentDamageBonus} 
            rolls={damageBonusRolls} 
            onReroll={(index: number, damageBonus: DamageOffense) => handleDamageOffenseReroll(index, damageBonus, setDamageBonusRolls)}
            setAmount={action => setCurrentDamageBonus(prev => 
            {
              const nextAmount = resolveSetState(action, prev.amount);
              if (nextAmount < 0) return prev;
              return { ...prev, amount: nextAmount };
            })}
            setGrade={action => setCurrentDamageBonus(prev => 
            {
              const nextGrade = resolveSetState(action, prev.grade);
              if (nextGrade < 1) return prev;
              return { ...prev, grade: nextGrade };
            })}
            setBonus={action => setCurrentDamageBonus(prev => 
            {
              const nextBonus = resolveSetState(action, prev.bonus);
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
  baseWeaponOffense: WeaponOffense;
  rolls: [number, boolean][];
  setRolls: React.Dispatch<React.SetStateAction<[number, boolean][]>>;
  setOffense: React.Dispatch<React.SetStateAction<WeaponOffense>>;
  handleWeaponReroll: (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => void;
  resetCallback: () => void;
};

function WeaponDamageWithCriticalSubcard(input: WeaponDamageWithCriticalSubcardProps)
{
  return (
    <Subcard className='col-span-3' name={input.name} callback={input.resetCallback} childrenInfo={<BaseWeaponDamageInfoView weaponOffense={input.baseWeaponOffense} />}>
      <WeaponDamageWithCriticalAndRolls 
        weaponOffense={input.weaponOffense} 
        rolls={input.rolls} 
        onReroll={(index: number, offense: WeaponOffense) => input.handleWeaponReroll(index, offense, input.setRolls)}
        setPower={action => input.setOffense(prev => 
        {
          const nextPower = resolveSetState(action, prev.critical.power);
          return { ...prev, critical: { ...prev.critical, power: nextPower } };
        })}
        setRange={action => input.setOffense(prev => 
        {
          const nextRange = resolveSetState(action, prev.critical.range);
          if (nextRange < -1 || nextRange > prev.grade * 2) return prev;
          return { ...prev, critical: { ...prev.critical, range: nextRange } };
        })}
        setAmount={action => input.setOffense(prev => 
        {
          const nextAmount = resolveSetState(action, prev.amount);
          if (nextAmount < 0) return prev;
          return { ...prev, amount: nextAmount };
        })}
        setGrade={action => input.setOffense(prev => 
        {
          const nextGrade = resolveSetState(action, prev.grade);
          if (nextGrade < 1) return prev;
          return { ...prev, grade: nextGrade };
        })}
        setBonus={action => input.setOffense(prev => 
        {
          const nextBonus = resolveSetState(action, prev.bonus);
          return { ...prev, bonus: nextBonus };
        })}
      />
  </Subcard>
  )
}

function BaseWeaponDamageInfoView({ weaponOffense }: { weaponOffense: WeaponOffense })
{
  return (
    <div className='flex flex-row gap-3'>
      <span>{toOffenseString(weaponOffense)}</span> 
      <span>{toCriticalRangeString(weaponOffense)}, +{weaponOffense.critical.power}</span>
    </div>
  );
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
      <div className='flex place-items-center gap-x-3'>
        <WeaponDamageView weaponOffense={weaponOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
      </div>
      <CriticalView weaponOffense={weaponOffense} setPower={setPower} setRange={setRange} />
      <RollsView rolls={rolls} onReroll={index => onReroll(index, weaponOffense)} />
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
      <div className='flex place-items-center gap-x-3'>
        <DamageBonusView damageOffense={damageOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
      </div>
      <RollsView rolls={rolls} onReroll={index => onReroll(index, damageOffense)} />
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
            <Badge key={index} className={`flex flex-row rounded-full px-1 font-mono ${isCritical ? 'bg-yellow-300' : ''}`}>
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
