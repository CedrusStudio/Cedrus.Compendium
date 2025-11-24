import RollButton from "@/common/components/buttons/RollButton";
import { colors } from "@/presentation/colors";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { toCriticalRangeString, rollTotalDamage, toOffenseString } from "@/domain/characters/combat/Offense";
import RollWithImmunityButton from "@/common/components/buttons/RollWithImmunityButton";
import { useState } from "react";
import { Character } from "@/domain/characters/Character";

export default function CharacterOffensesBattleView({ character }: { character: Character })
{
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(0);
  const selectedOffense = character.offenses[selectedOffenseIndex];
  const [rollTotalResult, setRollTotalResult] = useState<number>(0);
  const [rollTotalWithOneImmunityResult, setRollTotalWithOneImmunityResult] = useState<number>(0);
  const [rollTotalWithTwoImmunityResult, setRollTotalWithTwoImmunityResult] = useState<number>(0);

  const handleRollClick = () =>
  {
    const totalRoll = rollTotalDamage(selectedOffense);
    setRollTotalResult(totalRoll);
  }

  const handleRollWithOneImmunityClick = () =>
  {
    const totalRollWithOneImmunity = rollTotalDamage(selectedOffense, 1);
    setRollTotalWithOneImmunityResult(totalRollWithOneImmunity);
  }

  const handleRollWithTwoImmunityClick = () =>
  {
    const totalRollWithTwoImmunity = rollTotalDamage(selectedOffense, 2);
    setRollTotalWithTwoImmunityResult(totalRollWithTwoImmunity);
  }

  return (
    <div className="flex flex-row gap-4 items-center">
      {character.offenses.length > 1 && (
        <SelectOneOf name='offense' defaultValue='0' index={selectedOffenseIndex} items={character.offenses} setIndex={setSelectedOffenseIndex} disableInfo />
      )}

      <p>
        <span className={`${colors.offense.leading}`}>{toOffenseString(selectedOffense.leadingWeapon)}</span>
        {selectedOffense.secondaryWeapon && <span className={`${colors.offense.secondary}`}>{toOffenseString(selectedOffense.secondaryWeapon)}</span>}
        {toOffenseString(selectedOffense.damageBonus, true)}
      </p>

      <p>
        <span className={`${colors.offense.leading}`}>{`${toCriticalRangeString(selectedOffense.leadingWeapon)}, +${selectedOffense.leadingWeapon.critical.power}`}</span>
        {selectedOffense.secondaryWeapon && <span className={`${colors.offense.secondary}`}> | {`${toCriticalRangeString(selectedOffense.secondaryWeapon)}, +${selectedOffense.secondaryWeapon.critical.power}`}</span>}
      </p>

      <RollButton onClick={handleRollClick} rollResult={rollTotalResult} />

      <RollWithImmunityButton onClick={handleRollWithOneImmunityClick} rollWithImmunityResult={rollTotalWithOneImmunityResult} immunity={1} />
      <RollWithImmunityButton onClick={handleRollWithTwoImmunityClick} rollWithImmunityResult={rollTotalWithTwoImmunityResult} immunity={2} />
    </div>
  );
}