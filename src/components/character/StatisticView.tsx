"use client";

import { Statistic } from "@/domain/Character";
import { Button } from "../ui/button";
import { useState } from "react";

type StatisticViewProps = 
{
  name: string;
  statistic: Statistic;
};

export default function StatisticView({ name, statistic }: StatisticViewProps) 
{
  const [rollResult, setRollResult] = useState<number | null>(null);

  const handleRoll = (statistic: Statistic) => 
  {
    const result = Math.floor(Math.random() * statistic.grade * 2) + 1 + statistic.value + statistic.bonus;
    setRollResult(result);
  };

  return (
    <div className={'flex gap-x-6 items-center justify-around'}>
      <div className="w-24 capitalize">{name}</div>
      <div className="w-8">{statistic.value}</div>
      <div className="w-26">1k{statistic.grade * 2}+{statistic.value}+{statistic.bonus}</div>

      <Button variant='outline' onClick={() => handleRoll(statistic)} className="w-32 grid grid-cols-12 gap-0">
        <div className="col-span-10">Roll result:</div> 
        <div className="col-span-2 text-start">{rollResult}</div>
      </Button>
    </div>
  );
};
