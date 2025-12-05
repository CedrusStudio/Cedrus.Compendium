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
    <div className={'flex gap-x-3.5 items-center justify-around'}>

      <div className="capitalize">
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
      </div>
      
      <div className="flex items-center">
        1k{grade * 2}
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setGrade} />
        </div>
      </div>
      
      <div className="flex items-center">
        <Badge className="rounded-full px-1 font-mono inline">{value}</Badge>
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setValue} />
        </div>
      </div>
      
      <div className="flex items-center">
        {bonus}
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setBonus} />
        </div>
      </div>
      
      <div className="flex items-center">
        {testBonus}
        <div className="flex items-center">
          <VerticalChangeButtons setValue={setTestBonus} />
        </div>
      </div>

    </div>
  );
};