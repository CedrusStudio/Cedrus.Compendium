"use client";

import { Statistic } from "@/domain/Character";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge";
import RollButton from "./RollButton";

type StatisticViewProps = 
{
  name: string;
  statistic: Statistic;
  icon: React.ReactNode;
};

export default function StatisticView({ name, statistic, icon }: StatisticViewProps) 
{
  const [rollResult, setRollResult] = useState<number | null>(null);

  const handleRoll = (statistic: Statistic) => 
  {
    const result = Math.floor(Math.random() * statistic.grade * 2) + 1 + statistic.value + statistic.bonus;
    setRollResult(result);
  };

  return (
    <div className={'flex gap-x-2 items-center justify-around'}>
      <div className="capitalize">
        <Tooltip>
          <TooltipTrigger>{icon}</TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex items-end">
        1k{statistic.grade * 2}+
        <Badge className="rounded-full px-1 font-mono inline">{statistic.value}</Badge>
        +{statistic.bonus}
      </div>

      <RollButton onClick={() => handleRoll(statistic)} rollResult={rollResult} />
    </div>
  );
};
