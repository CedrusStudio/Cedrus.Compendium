"use client";

import { Statistic } from "@/domain/characters/statistics/Statistic";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/tooltip";
import { Badge } from "@/ui/badge";
import VerticalChangeButtons from "@/common/components/buttons/VerticalChangeButtons";
import ResetButton from "@/common/components/buttons/ResetButton";
import { type StatisticsDto } from "@/persistence/schemas/characters/statistics/statisticsSchema";
import { useFormContext } from "react-hook-form";
import { StatisticPath } from "@/application/characters/edit/statistics/EditStatisticsCard";
import { useStatisticForm } from "@/application/characters/edit/statistics/useStatisticForm";
import { displayedText } from "@/common/translations";

type StatisticViewEditProps = 
{
  name: string;
  statistic: Statistic;
  icon: React.ReactNode;
  fieldPath: StatisticPath;
};

export default function EditStatisticView({ name, statistic, icon, fieldPath }: StatisticViewEditProps) 
{
  const { control } = useFormContext<StatisticsDto>();
  const { grade, setGrade, value, setValue, bonus, setBonus, testBonus, setTestBonus } = useStatisticForm(control, fieldPath, statistic);

  return (
    <div className="grid grid-cols-2 gap-3 rounded-md border p-3 sm:flex sm:items-center sm:justify-around sm:gap-x-3.5 sm:border-0 sm:p-0">

      <div className="col-span-2 flex items-center justify-center gap-2 capitalize">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ResetButton 
                variant='ghost' 
                defaultValuesWithSetters=
                {
                  [
                    [statistic.bonus, setBonus],
                    [statistic.grade, setGrade],
                    [statistic.value, setValue],
                    [statistic.testBonus, setTestBonus]
                  ]
                }
              >
                {icon}
              </ResetButton>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{displayedText[name as keyof typeof displayedText]}</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium sm:hidden">{displayedText[name as keyof typeof displayedText]}</span>
      </div>
      
      <div className="flex flex-col items-center gap-1 sm:flex-row">
        <span className="text-xs text-muted-foreground sm:sr-only">{displayedText.grade}</span>
        <div className="flex items-center">
        1k{grade * 2}
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setGrade} />
        </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1 sm:flex-row">
        <span className="text-xs text-muted-foreground sm:sr-only">{displayedText.value}</span>
        <div className="flex items-center">
        <Badge className="rounded-full px-1 font-mono inline">{value}</Badge>
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setValue} />
        </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1 sm:flex-row">
        <span className="text-xs text-muted-foreground sm:sr-only">{displayedText.bonus}</span>
        <div className="flex items-center">
        {bonus}
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setBonus} />
        </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1 sm:flex-row">
        <span className="text-xs text-muted-foreground sm:sr-only">{displayedText.testBonus}</span>
        <div className="flex items-center">
        {testBonus}
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setTestBonus} />
        </div>
        </div>
      </div>

    </div>
  );
};
