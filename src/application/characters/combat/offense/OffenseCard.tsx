"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { displayedText } from '@/common/translations';
import { useCombatRolls } from '@/application/characters/combat/useCombatRolls';
import OffenseHeader from '@/application/characters/combat/offense/OffenseHeader';
import DamageBonusSubcard from '@/application/characters/combat/offense/DamageBonusSubcard';
import { WeaponDamageWithCriticalSubcard } from '@/application/characters/combat/offense/WeaponDamageWithCriticalSubcard';
import { useEffect, useState } from 'react';
import { Button } from '@/ui/button';
import { showHideIcon } from '@/common/icons';

type OffenseCardProps = 
{
  offenses: Offense[];
};

export default function OffenseCard({ offenses }: OffenseCardProps)
{
  if (offenses.length === 0)
  {
    return null;
  }

  return <OffenseCardContent offenses={offenses} />;
}

function OffenseCardContent({ offenses }: OffenseCardProps)
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
    additionalDamageBonusRolls,
    setAdditionalDamageBonusRolls,
    currentLeadingOffense,
    setCurrentLeadingOffense,
    currentSecondaryOffense,
    setCurrentSecondaryOffense,
    currentDamageBonus,
    setCurrentDamageBonus,
    currentAdditionalDamageBonus,
    setCurrentAdditionalDamageBonus,
    selectedOffenseIndex,
    setSelectedOffenseIndex
  } = useCombatRolls(offenses);

  const selectedOffense = offenses[selectedOffenseIndex];
  const leadingOffense = selectedOffense.leadingWeapon;
  const secondaryOffense = selectedOffense.secondaryWeapon;
  const damageBonus = selectedOffense.damageBonus;
  const additionalDamageBonus = selectedOffense.additionalDamageBonus;
  const [isDescriptionVisible, setIsDescriptionVisible] = useState<boolean>(true);

  const offenseDescription = selectedOffense.description?.trim();
  const hasDescription = Boolean(offenseDescription);
  const descriptionToggleLabel = isDescriptionVisible ? displayedText.hideDescription : displayedText.showDescription;

  const toggleDescriptionVisibility = () =>
  {
    setIsDescriptionVisible(previousValue => !previousValue);
  };

  useEffect(() =>
  {
    setIsDescriptionVisible(true);
  }, [selectedOffense]);

  return (
    <Card className='bg-muted w-full'>

      <CardHeader className='flex flex-col gap-3 items-center justify-center'>
        <div className='relative flex w-full items-center justify-center'>
          <CardTitle className='font-bold'>
            <span className='capitalize text-2xl'>{displayedText.offense}</span>
          </CardTitle>

          {
            hasDescription && (
              <Button
                type='button'
                variant='ghost'
                className='absolute right-0 h-8 w-8 p-0 text-muted-foreground'
                onClick={toggleDescriptionVisibility}
                aria-expanded={isDescriptionVisible}
                aria-label={descriptionToggleLabel}
                title={descriptionToggleLabel}
              >
                {showHideIcon(!isDescriptionVisible, 'h-4 w-4')}
              </Button>
            )
          }
        </div>

        <OffenseHeader 
          offenses={offenses}
          selectedOffenseIndex={selectedOffenseIndex}
          setSelectedOffenseIndex={setSelectedOffenseIndex}
          totalResult={totalResult}
          handleRoll={handleRoll}
          disableInfo
        />
      </CardHeader>

      <CardContent className='flex flex-col flex-1 gap-5 place-items-center place-content-center'>

        {
          hasDescription && isDescriptionVisible && (
            <p className='w-full max-w-md text-center text-sm italic text-muted-foreground'>
              {offenseDescription}
            </p>
          )
        }

        <div className='flex w-full flex-col flex-wrap gap-1 place-content-center md:flex-row'>

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

        <DamageBonusSubcard
          damageBonus={damageBonus}
          currentDamageBonus={currentDamageBonus}
          damageBonusRolls={damageBonusRolls}
          handleDamageOffenseReroll={handleDamageOffenseReroll}
          setCurrentDamageBonus={setCurrentDamageBonus}
          setDamageBonusRolls={setDamageBonusRolls}
        />
            
        {
          currentAdditionalDamageBonus && (
            <DamageBonusSubcard
              damageBonus={additionalDamageBonus as DamageOffense}
              currentDamageBonus={currentAdditionalDamageBonus}
              damageBonusRolls={additionalDamageBonusRolls}
              handleDamageOffenseReroll={handleDamageOffenseReroll}
              setCurrentDamageBonus={additionalDamageOffense => setCurrentAdditionalDamageBonus(additionalDamageOffense as DamageOffense)}
              setDamageBonusRolls={setAdditionalDamageBonusRolls}
            />
          ) 
        }

        </div>
        
      </CardContent>
    </Card>
  );
}
