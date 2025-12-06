import { Character } from "@/domain/characters/Character";
import { Power, PowerSpecification } from "@/domain/characters/combat/Power";
import { toCriticalRangeString, toOffenseString } from "@/domain/characters/combat/Offense";
import { usePowerRolls } from '@/application/characters/combat/usePowerRolls';
import { displayedText } from "@/common/translations";
import { useState, useEffect, Activity, SetStateAction, Dispatch } from "react";
import { showHideIcon, resetIcon } from "@/common/icons";
import { Button } from "@/common/components/ui/button";
import { colors } from "@/common/colors";
import { SpellOffenseSubcard } from "@/application/characters/combat/power/SpellOffenseSubcard";
import SpellDamageSubcard from "@/application/characters/combat/power/SpellDamageSubcard";
import RollButton from "@/common/components/buttons/RollButton";
import { Badge } from "@/common/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import powerSpecificationsClient from '@/infrastructure/clients/powerSpecificationsClient';
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import PowerOffenseSelector from "@/application/characters/combat/power/PowerOffenseSelector";
import { Input } from "@/common/components/ui/input";

type CharacterPowersBattleViewProps =
{
  character: Character;
  initiallyHideAdvancedCombat?: boolean;
};

export default function CharacterPowersBattleView({ character, initiallyHideAdvancedCombat = true }: CharacterPowersBattleViewProps)
{
  const [hideAdvancedCombat, setHideAdvancedCombat] = useState<boolean>(initiallyHideAdvancedCombat);
  const [selectedPowerIndex, setSelectedPowerIndex] = useState<number>(0);
  
  const power = character.powers[selectedPowerIndex];
  const defaultOffenseIndex = power.level + power.bonus;
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(defaultOffenseIndex);

  // Reset offense index when power changes
  useEffect(() => 
  {
    const newDefaultIndex = power.level + power.bonus;
    setSelectedOffenseIndex(newDefaultIndex);
  }, [selectedPowerIndex, power.level, power.bonus]);

  // Fetch the PowerSpecification
  const { data: powerSpecification } = useQuery<PowerSpecification>
  ({
    queryKey: ['powerSpecification', power.powerSpecificationId],
    queryFn: () => powerSpecificationsClient.get(power.powerSpecificationId),
    enabled: !!power.powerSpecificationId && power.powerSpecificationId.length > 0,
    staleTime: 5_000
  });

  if (!powerSpecification || !powerSpecification.offenses || powerSpecification.offenses.length === 0)
  {
    return null;
  }

  const offenses = powerSpecification.offenses;
  const maxIndex = offenses.length - 1;
  const currentIndex = Math.min(selectedOffenseIndex, maxIndex);
  const offense = offenses[currentIndex];

  if (!offense) return null;

  const attackString = toOffenseString(offense.spellOffense);
  const damageString = toOffenseString(offense.spellDamage, true);
  const criticalString = `${toCriticalRangeString(offense.spellOffense)}, ${offense.spellOffense.critical.power >= 0 ? "+" : ""}${offense.spellOffense.critical.power}`;

  const simpleCombat = (
    <div className="flex flex-col gap-1">
        
      <div className="flex items-center gap-2">

        <Badge variant="secondary" className="text-xs">
          Siła Zaklęcia: {power.level}+{power.bonus}
        </Badge>

        <Badge variant="default" className="text-xs">
          {displayedText.essence}: {power.essence}
        </Badge>

      </div>
      
      <p className="text-sm">
        <span className={`${colors.offense.leading}`}>{attackString}</span>
        {damageString && <span>{damageString}</span>}
        <span className={`${colors.offense.leading} ml-2`}>{criticalString}</span>
      </p>

    </div>
  );

  return (
    <div className="flex flex-row place-items-center gap-2">

        <Activity mode={character.powers.length > 1 ? "visible" : "hidden"}>
          <SelectOneOf 
            name='power' 
            defaultValue='0' 
            index={selectedPowerIndex} 
            items={character.powers} 
            setIndex={setSelectedPowerIndex} 
            disableInfo 
          />
        </Activity>

        <Activity mode={hideAdvancedCombat ? "visible" : "hidden"}>
            {simpleCombat}
        </Activity>

        <Activity mode={hideAdvancedCombat ? "hidden" : "visible"}>
            <AdvancedPowerCombat 
                power={power}
                powerSpecification={powerSpecification}
                selectedOffenseIndex={selectedOffenseIndex}
                setSelectedOffenseIndex={setSelectedOffenseIndex}
            />
        </Activity>

      <Button onClick={() => setHideAdvancedCombat(!hideAdvancedCombat)} variant="ghost" size="sm">
        {showHideIcon(hideAdvancedCombat)}
      </Button>
    </div>
  );
}

type AdvancedPowerCombatProps =
{
  power: Power;
  powerSpecification: PowerSpecification;
  selectedOffenseIndex: number;
  setSelectedOffenseIndex: Dispatch<SetStateAction<number>>;
};

function AdvancedPowerCombat
(
    { 
        power, 
        powerSpecification, 
        selectedOffenseIndex,
        setSelectedOffenseIndex
    }
    : AdvancedPowerCombatProps
)
{
  const offenses = powerSpecification.offenses;
  const maxIndex = offenses.length - 1;
  const currentIndex = Math.min(selectedOffenseIndex, maxIndex);
  const offense = offenses[currentIndex];

  const [currentEssence, setCurrentEssence] = useState(power.essence);

  const {
    totalResult,
    handleRoll,
    handleSpellOffenseReroll,
    handleSpellDamageReroll,
    spellOffenseRolls,
    setSpellOffenseRolls,
    spellDamageRolls,
    setSpellDamageRolls,
    currentSpellOffense,
    setCurrentSpellOffense,
    currentSpellDamage,
    setCurrentSpellDamage
  } = usePowerRolls(offenses, currentIndex);

  const [hideAdvanceSelector, setHideAdvanceSelector] = useState<boolean>(false);

  return (
    <div className="flex flex-row gap-1.5 place-content-center place-items-center">
      
        <div className="flex flex-row gap-2 place-items-center place-content-center">

            <div className="flex flex-col gap-1 items-center">

                <div className="flex flex-col mb-1 items-center">
                    <RollButton onClick={handleRoll} rollResult={totalResult()} />
                </div>

                <Badge variant="secondary" className="text-xs">
                    Siła Zaklęcia: {power.level}+{power.bonus}
                </Badge>

                {/* Essence Input and Reset */}
                <div className="flex flex-row gap-1 items-center">
                  <Input 
                    id="essence" 
                    type="number" 
                    value={currentEssence} 
                    onChange={e => setCurrentEssence(Number(e.target.value))} 
                    className="w-16 h-8 text-xs"
                  /> 
                  <span className="text-xs">/ {power.essence}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentEssence(power.essence)} 
                    title="Reset essence to max"
                    className="h-8 w-8"
                  >
                    {resetIcon()}
                  </Button>
                </div>
                
                <Button onClick={() => setHideAdvanceSelector(!hideAdvanceSelector)} variant="ghost" size="sm">
                    {showHideIcon(hideAdvanceSelector)}
                </Button>

            </div>

            <Activity mode={hideAdvanceSelector ? "visible" : "hidden"}>
                <PowerOffenseSelector
                    onSelectIndex={setSelectedOffenseIndex}
                    powerSpecification={powerSpecification}
                    selectedIndex={selectedOffenseIndex}
                    /> 
            </Activity>

        </div>


        <div className="flex flex-col md:flex-row place-content-center gap-2 md:gap-4">
            <SpellOffenseSubcard 
                name={displayedText.powerAttack}
                spellOffense={currentSpellOffense}
                baseSpellOffense={offense.spellOffense}
                rolls={spellOffenseRolls}
                setRolls={setSpellOffenseRolls}
                setOffense={setCurrentSpellOffense}
                handleReroll={handleSpellOffenseReroll}
                resetCallback={() => setCurrentSpellOffense(offense.spellOffense)}
            />

            <SpellDamageSubcard 
                name={displayedText.bonus}
                spellDamage={currentSpellDamage}
                baseSpellDamage={offense.spellDamage}
                rolls={spellDamageRolls}
                setRolls={setSpellDamageRolls}
                setDamage={setCurrentSpellDamage}
                handleReroll={handleSpellDamageReroll}
                resetCallback={() => setCurrentSpellDamage(offense.spellDamage)}
            />
        </div>
    </div>
  );
}
