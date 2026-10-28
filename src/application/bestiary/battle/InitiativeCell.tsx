"use client";

import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { actions } from "@/persistence/slices/bestiarySlice";
import { rollInitiative } from "@/domain/characters/statistics/Attributes";
import { displayedText } from "@/common/translations";
import { cancelIcon, editIcon, okIcon, resetIcon, rollIcon } from "@/common/icons";
import { Statistic } from "@/domain/characters/statistics/Statistic";
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { makeRollRecord, statisticPreset } from '@/domain/diceRoller';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';

type InitiativeCellProps = 
{
  id: string;
  initiative: Statistic;
};

export default function InitiativeCell({ id, initiative }: InitiativeCellProps) 
{
  const dispatch = useDispatch();
  const diceRoller = useOptionalDiceRoller();
  const initiativeEntry = useSelector((state: RootState) => state.bestiary.initiatives[id]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValue, setManualValue] = useState<string>("");
  const currentInitiative = initiativeEntry?.initiative ?? null;

  const handleRoll = () => 
  {
    const rollResult = rollInitiative(initiative);
    diceRoller?.record(makeRollRecord(statisticPreset(displayedText.initiative, initiative), [[{ value: rollResult - initiative.value - initiative.bonus - initiative.testBonus, critical: false }]]));
    dispatch(actions.rollInitiativeForCharacter({ characterId: id, rollResult }));
    setIsManualMode(false);
  };

  const handleManualSet = () => 
  {
    const value = parseInt(manualValue, 10);

    if (isNaN(value)) 
    {
      return;
    }
    
    dispatch(actions.setInitiative({ characterId: id, initiative: value }));
    setIsManualMode(false);
    setManualValue("");
  };

  const handleCancelManual = () => 
  {
    setIsManualMode(false);
    setManualValue("");
  };

  const handleClear = () => 
  {
    dispatch(actions.removeInitiativeForCharacter(id));
  };

  if (isManualMode) 
  {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
            
          <Input
            type="number"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder="0"
            className="w-16 h-8 text-center"
            autoFocus
            onKeyDown={e => 
            {
              if (e.key === 'Enter') handleManualSet();
              if (e.key === 'Escape') handleCancelManual();
            }}
          />

          <Button size="icon" variant="ghost" onClick={handleManualSet} className="h-8 w-8">
            {okIcon()}
          </Button>

          <Button size="icon" variant="ghost" onClick={handleCancelManual} className="h-8 w-8">
            {cancelIcon()}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">

      <div className="flex items-center gap-2">

        <div className="text-md font-bold min-w-[3rem] text-center">
          {currentInitiative}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRoll} title={displayedText.rollInitiative}>
            {rollIcon}
          </Button>
          <Button variant="ghost" size="sm" aria-label={`${diceText.open}: ${displayedText.initiative}`} title={diceText.open} onClick={() => diceRoller?.open(statisticPreset(displayedText.initiative, initiative))}>⋯</Button>
          
          <Button variant="outline" size="icon" onClick={() => setIsManualMode(true)} title={displayedText.manualInitiative}>
            {editIcon}
          </Button>
        </div>

      {
        currentInitiative !== null && (
          <Button variant="outline" size="icon" onClick={handleClear}>
            {resetIcon()}
          </Button>
        )
      }
      </div>
    </div>
  );
}
