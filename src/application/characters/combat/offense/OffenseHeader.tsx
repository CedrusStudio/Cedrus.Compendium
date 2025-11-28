import RollButton from "@/common/components/buttons/RollButton";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { Offense } from "@/domain/characters/combat/Offense";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";

type OffenseHeaderProps =
{
  offenses: Offense[];
  selectedOffenseIndex: number;
  setSelectedOffenseIndex: Dispatch<SetStateAction<number>>;
  totalResult: () => number;
  handleRoll: () => void;
  className?: string;
};

export default function OffenseHeader({ offenses, selectedOffenseIndex, setSelectedOffenseIndex, totalResult, handleRoll, className }: OffenseHeaderProps)
{
  return (
    <div className={cn('flex flex-row place-content-center place-items-center gap-3', className)}>

      <RollButton onClick={handleRoll} rollResult={totalResult()} />

      {
        offenses.length > 1 && (
          <div className='flex flex-row place-content-center place-items-center gap-4'>
            <SelectOneOf name='defense' defaultValue='0' index={selectedOffenseIndex} items={offenses} setIndex={setSelectedOffenseIndex} />
          </div>
        )
      }

    </div>
  );
};