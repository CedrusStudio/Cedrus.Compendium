import { DamageOffense, toCriticalRangeString, toOffenseString, WeaponOffense } from "@/domain/characters/combat/Offense";
import { useCombatRolls } from '@/application/characters/combat/useCombatRolls';
import { Character } from "@/domain/characters/Character";
import { displayedText } from "@/common/translations";
import OffenseHeader from "@/application/characters/combat/offense/OffenseHeader";
import { WeaponDamageWithCriticalSubcard } from "@/application/characters/combat/offense/WeaponDamageWithCriticalSubcard";
import DamageBonusSubcard from "@/application/characters/combat/offense/DamageBonusSubcard";
import { useState } from "react";
import { showHideIcon } from "@/common/icons";
import { Button } from "@/common/components/ui/button";
import { colors } from "@/common/colors";

type CharacterOffensesBattleViewProps =
{
  character: Character;
  initiallyHideAdvancedCombat?: boolean;
};

export default function CharacterOffensesBattleView({ character, initiallyHideAdvancedCombat = true }: CharacterOffensesBattleViewProps)
{
  const [hideAdvancedCombat, setHideAdvancedCombat] = useState<boolean>(initiallyHideAdvancedCombat);

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
  } = useCombatRolls(character.offenses);
  
  const leadingOffense = character.offenses[selectedOffenseIndex].leadingWeapon;
  const secondaryOffense = character.offenses[selectedOffenseIndex].secondaryWeapon;
  const damageBonus = character.offenses[selectedOffenseIndex].damageBonus;
  const additionalDamageBonus = character.offenses[selectedOffenseIndex].additionalDamageBonus;

  const simpleCombat = (
    <>
      <p>
        <span className={`${colors.offense.leading}`}>{toOffenseString(leadingOffense)}</span>
        {secondaryOffense && <span className={`${colors.offense.secondary}`}>+{toOffenseString(secondaryOffense)}</span>}
        {toOffenseString(damageBonus, true)}
        {additionalDamageBonus && toOffenseString(additionalDamageBonus, true)}
      </p>

      <p>
        <span className={`${colors.offense.leading}`}>{`${toCriticalRangeString(leadingOffense)}, +${leadingOffense.critical.power}`}</span>
        {secondaryOffense && <span className={`${colors.offense.secondary}`}> | {`${toCriticalRangeString(secondaryOffense)}, +${secondaryOffense.critical.power}`}</span>}
      </p>
    </>
  )

  const advancedCombat = (
    <div className="flex flex-row gap-1.5 place-content-center">

      <OffenseHeader 
        offenses={character.offenses}
        selectedOffenseIndex={selectedOffenseIndex}
        setSelectedOffenseIndex={setSelectedOffenseIndex}
        totalResult={totalResult}
        handleRoll={handleRoll}
        className="flex-col-reverse"
        disableInfo={true}
      />

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
  );

  return (
    <div className="flex flex-row place-items-center gap-2">
      {
        hideAdvancedCombat ? simpleCombat : advancedCombat
      }

      <Button onClick={() => setHideAdvancedCombat(!hideAdvancedCombat)} variant="ghost" >
        {showHideIcon(hideAdvancedCombat)}
      </Button>
    </div>
  );
}