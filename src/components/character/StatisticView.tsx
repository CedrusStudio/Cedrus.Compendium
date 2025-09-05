"use client";

import { Statistic } from "@/domain/Character";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge";
import RollButton from "@/components/character/RollButton";
import VerticalChangeButtons from "@/components/VerticalChangeButtons";
import ResetButton from "@/components/ResetButton";

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

  const handleRoll = (statistic: Statistic) => 
  {
    const result = Math.floor(Math.random() * statistic.grade * 2) + 1 + statistic.value + bonus;
    setRollResult(result);
  };

  return (
    <div className={'flex gap-x-2 items-center justify-around'}>
      <div className="capitalize">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ResetButton variant='ghost' value={defaultBonus} icon={icon} setValue={setBonus} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex items-center">
        1k{statistic.grade * 2}+
        <Badge className="rounded-full px-1 font-mono inline">{statistic.value}</Badge>
        <div className="flex items-center">
          {bonus >= 0 ? `+${bonus}` : bonus}
          <VerticalChangeButtons value={1} setValue={setBonus} />
        </div>
      </div>

      <RollButton onClick={() => handleRoll(statistic)} rollResult={rollResult} />
    </div>
  );
};

function calculateDefaultBonus(statistic: Statistic): number
{
  return statistic.bonus + statistic.testBonus;
}