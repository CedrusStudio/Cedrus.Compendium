import RollButton from "@/common/components/buttons/RollButton";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { Offense } from "@/domain/characters/combat/Offense";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";
import { type RollPreset, offensePreset } from '@/domain/diceRoller';
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { Button } from '@/ui/button';
import { diceText, dicePoolNames } from '@/application/dice-roller/DiceRollerPanel';

type OffenseHeaderProps =
{
  offenses: Offense[];
  selectedOffenseIndex: number;
  setSelectedOffenseIndex: Dispatch<SetStateAction<number>>;
  totalResult: () => number;
  handleRoll: () => void;
  className?: string;
  disableInfo?: boolean;
  preset?: RollPreset;
};

export default function OffenseHeader({ offenses, selectedOffenseIndex, setSelectedOffenseIndex, totalResult, handleRoll, className, disableInfo, preset }: OffenseHeaderProps)
{
  const diceRoller = useOptionalDiceRoller();
  return (
    <div className={cn('flex flex-row place-content-center place-items-center gap-3', className)}>

      <RollButton onClick={handleRoll} rollResult={totalResult()} />
      <Button variant="ghost" size="sm" aria-label={`${diceText.open}: ${offenses[selectedOffenseIndex]?.name ?? ''}`} title={diceText.open} onClick={() => diceRoller?.open(preset ?? offensePreset(offenses[selectedOffenseIndex], dicePoolNames))}>⋯</Button>

      {
        offenses.length > 1 && (
          <div className='flex flex-row place-content-center place-items-center gap-4'>
            <SelectOneOf name='defense' defaultValue='0' index={selectedOffenseIndex} items={offenses} setIndex={setSelectedOffenseIndex} disableInfo={disableInfo} />
          </div>
        )
      }

    </div>
  );
};
