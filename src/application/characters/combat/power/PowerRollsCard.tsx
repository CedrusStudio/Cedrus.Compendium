"use client";

import { PowerOffense } from '@/domain/characters/combat/Power';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { displayedText } from '@/common/translations';
import { usePowerRolls } from '@/application/characters/combat/usePowerRolls';
import RollButton from '@/common/components/buttons/RollButton';
import { SpellOffenseSubcard } from '@/application/characters/combat/power/SpellOffenseSubcard';
import SpellDamageSubcard from '@/application/characters/combat/power/SpellDamageSubcard';
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { powerPreset } from '@/domain/diceRoller';
import { diceText, dicePoolNames } from '@/application/dice-roller/DiceRollerPanel';
import { Button } from '@/ui/button';

type PowerRollsCardProps = 
{
  offenses: PowerOffense[];
  selectedIndex: number;
};

export default function PowerRollsCard({ offenses, selectedIndex }: PowerRollsCardProps) 
{
  const diceRoller = useOptionalDiceRoller();
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
  } = usePowerRolls(offenses, selectedIndex);

  const offense = offenses[selectedIndex];
  if (!offense) return null;

  return (
    <Card className='bg-muted/50 border-primary/20'>
      <CardHeader>
        <CardTitle className='flex justify-center items-center gap-3'>
          <RollButton onClick={handleRoll} rollResult={totalResult()} />
          <Button variant="ghost" size="sm" aria-label={diceText.open} title={diceText.open} onClick={() => diceRoller?.open(powerPreset(displayedText.power, { ...offense, spellOffense: currentSpellOffense, spellDamage: currentSpellDamage }, dicePoolNames))}>⋯</Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col md:flex-row place-content-center gap-2 md:gap-4">
        
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

      </CardContent>
    </Card>
  );
}
