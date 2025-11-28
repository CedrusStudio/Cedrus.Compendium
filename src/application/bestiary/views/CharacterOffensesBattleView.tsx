import { toCriticalRangeString, toOffenseString, WeaponOffense } from "@/domain/characters/combat/Offense";
import { useCombatRolls } from '@/application/characters/combat/useCombatRolls';
import { Character } from "@/domain/characters/Character";
import { displayedText } from "@/presentation/translations";
import OffenseHeader from "@/application/characters/combat/offense/OffenseHeader";
import { WeaponDamageWithCriticalSubcard } from "@/application/characters/combat/offense/WeaponDamageWithCriticalSubcard";
import DamageBonusSubcardView from "@/application/characters/combat/offense/DamageBonusView";
import { useState } from "react";
import { showHideIcon } from "@/presentation/icons";
import { Button } from "@/common/components/ui/button";
import { colors } from "@/presentation/colors";

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
    currentLeadingOffense,
    setCurrentLeadingOffense,
    currentSecondaryOffense,
    setCurrentSecondaryOffense,
    currentDamageBonus,
    setCurrentDamageBonus,
    selectedOffenseIndex,
    setSelectedOffenseIndex
  } = useCombatRolls(character.offenses);
  
  const leadingOffense = character.offenses[selectedOffenseIndex].leadingWeapon;
  const secondaryOffense = character.offenses[selectedOffenseIndex].secondaryWeapon;
  const damageBonus = character.offenses[selectedOffenseIndex].damageBonus;

  const simpleCombat = (
    <>
      <p>
        <span className={`${colors.offense.leading}`}>{toOffenseString(leadingOffense)}</span>
        {secondaryOffense && <span className={`${colors.offense.secondary}`}>+{toOffenseString(secondaryOffense)}</span>}
        {toOffenseString(damageBonus, true)}
      </p>

      <p>
        <span className={`${colors.offense.leading}`}>{`${toCriticalRangeString(leadingOffense)}, +${leadingOffense.critical.power}`}</span>
        {secondaryOffense && <span className={`${colors.offense.secondary}`}> | {`${toCriticalRangeString(secondaryOffense)}, +${secondaryOffense.critical.power}`}</span>}
      </p>
    </>
  )

  const advancedCombat = (
    <div className="flex flex-row gap-4 place-content-center">

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

      <DamageBonusSubcardView 
        damageBonus={damageBonus}
        currentDamageBonus={currentDamageBonus}
        damageBonusRolls={damageBonusRolls}
        handleDamageOffenseReroll={handleDamageOffenseReroll}
        setCurrentDamageBonus={setCurrentDamageBonus}
        setDamageBonusRolls={setDamageBonusRolls}
      />
        
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