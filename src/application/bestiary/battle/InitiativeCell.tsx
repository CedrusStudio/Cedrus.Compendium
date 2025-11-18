"use client";

import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { actions } from "@/persistence/slices/bestiarySlice";
import { rollInitiative } from "@/domain/characters/statistics/Attributes";
import { displayedText } from "@/presentation/translations";
import { resetIcon, rollIcon } from "@/presentation/icons";
import { FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import { Statistic } from "@/domain/characters/statistics/Statistic";

type InitiativeCellProps = 
{
  id: string;
  initiative: Statistic;
};

export default function InitiativeCell({ id, initiative }: InitiativeCellProps) 
{
  const dispatch = useDispatch();
  const initiativeEntry = useSelector((state: RootState) => state.bestiary.initiatives[id]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValue, setManualValue] = useState<string>("");
  const currentInitiative = initiativeEntry?.initiative ?? null;

  const handleRoll = () => 
  {
    const rollResult = rollInitiative(initiative);
    dispatch(actions.rollInitiativeForCharacter({ characterId: id, rollResult }));
    setIsManualMode(false);
  };

  const handleManualSet = () => 
  {
    const value = parseInt(manualValue);

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
            <FaCheck className="w-3 h-3" />
          </Button>

          <Button size="icon" variant="ghost" onClick={handleCancelManual} className="h-8 w-8">
            <FaTimes className="w-3 h-3" />
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
          
          <Button variant="outline" size="icon" onClick={() => setIsManualMode(true)} title={displayedText.manualInitiative}>
            <FaPencilAlt />
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
