"use client";

import { Statistic } from "@/domain/characters/statistics/Statistic";
import { useState } from "react";
import { Badge } from "@/ui/badge";
import RollButton from "@/common/components/buttons/RollButton";
import VerticalChangeButtons from "@/common/components/buttons/VerticalChangeButtons";
import ResetButton from "@/common/components/buttons/ResetButton";
import { getColorTextChange } from "@/common/colors";
import FieldWithTooltip from "@/common/components/fields/FieldWithTooltip";
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { makeRollRecord, statisticPreset } from '@/domain/diceRoller';
import { Button } from '@/ui/button';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';

type StatisticViewProps = 
{
  name: string;
  statistic: Statistic;
  icon: React.ReactNode;
};

export default function StatisticView({ name, statistic, icon }: StatisticViewProps) 
{
  const defaultBonus = calculateDefaultBonus(statistic);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [bonus, setBonus] = useState<number>(defaultBonus);
  const diceRoller = useOptionalDiceRoller();
  const preset = () => statisticPreset(name, statistic, bonus - defaultBonus);

  const handleRoll = (statistic: Statistic) => 
  {
    const result = Math.floor(Math.random() * statistic.grade * 2) + 1
    setRollResult(result);
    diceRoller?.record(makeRollRecord(preset(), [[{ value: result, critical: false }]]));
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-around gap-2">

      <FieldWithTooltip name={name} >
        <ResetButton variant='ghost' defaultValuesWithSetters={[[defaultBonus, setBonus]]}>
          {icon}
        </ResetButton>
      </FieldWithTooltip>

      <div className="flex items-center">
        1k{statistic.grade * 2}+
        <Badge className="rounded-full px-1 font-mono inline">{statistic.value}</Badge>
        <div className={"flex items-center"}>
          <span className="flex items-center">
            {bonus >= 0 ? '+' : ''}<BonusView bonus={bonus} defaultBonus={defaultBonus} />
          </span>
          <VerticalChangeButtons setValue={setBonus} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <RollButton onClick={() => handleRoll(statistic)} rollResult={calculateRollResult(rollResult, statistic, bonus)} />
        <Button variant="ghost" size="sm" aria-label={`${diceText.open}: ${name}`} title={diceText.open} onClick={() => diceRoller?.open(preset())}>⋯</Button>
      </div>
    </div>
  );
};

function calculateRollResult(roll: number | null, statistic: Statistic, bonus: number): number | null
{
  if (roll === null) return null;
  return roll + statistic.value + bonus;
}

function calculateDefaultBonus(statistic: Statistic): number
{
  return statistic.bonus + statistic.testBonus;
}

function BonusView({ defaultBonus, bonus }: { defaultBonus: number; bonus: number })
{
  return (
    <span className={`flex items-center ${getColorTextChange(bonus, defaultBonus)}`}>
      {bonus}
    </span>
  );
}
