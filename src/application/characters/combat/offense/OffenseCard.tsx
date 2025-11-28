"use client";

import { Offense, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { displayedText } from '@/presentation/translations';
import { useCombatRolls } from '@/application/characters/combat/useCombatRolls';
import OffenseHeader from '@/application/characters/combat/offense/OffenseHeader';
import DamageBonusSubcardView from '@/application/characters/combat/offense/DamageBonusView';
import { WeaponDamageWithCriticalSubcard } from '@/application/characters/combat/offense/WeaponDamageWithCriticalSubcard';

type OffenseCardProps = 
{
  offenses: Offense[];
};

export default function OffenseCard({ offenses }: OffenseCardProps)
{
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
    selectedOffenseIndex,
    setSelectedOffenseIndex
  } = useCombatRolls(offenses);

  const leadingOffense = offenses[selectedOffenseIndex].leadingWeapon;
  const secondaryOffense = offenses[selectedOffenseIndex].secondaryWeapon;
  const damageBonus = offenses[selectedOffenseIndex].damageBonus;

  return (
    <Card className='bg-muted'>
      <CardHeader>
        <CardTitle className='flex sm:flex-row justify-center items-center gap-3 font-bold'>
          <span className='capitalize text-2xl'>{displayedText.offense}</span>
          <OffenseHeader 
            offenses={offenses}
            selectedOffenseIndex={selectedOffenseIndex}
            setSelectedOffenseIndex={setSelectedOffenseIndex}
            totalResult={totalResult}
            handleRoll={handleRoll}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col md:flex-row gap-1 ">

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

        <DamageBonusSubcardView
          damageBonus={damageBonus}
          currentDamageBonus={currentDamageBonus}
          damageBonusRolls={damageBonusRolls}
          handleDamageOffenseReroll={handleDamageOffenseReroll}
          setCurrentDamageBonus={setCurrentDamageBonus}
          setDamageBonusRolls={setDamageBonusRolls}
        />
        
      </CardContent>
    </Card>
  );
}
