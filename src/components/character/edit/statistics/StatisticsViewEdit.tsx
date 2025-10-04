"use client";

import { Statistic } from "@/domain/Character";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge";
import VerticalChangeButtons from "@/components/global/buttons/VerticalChangeButtons";
import ResetMultipleButton from "@/components/global/buttons/ResetMultipleButton";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { StatisticPath } from "@/components/character/edit/statistics/StatisticsCardEdit";
import { useStatisticForm } from "@/components/character/edit/statistics/useStatisticForm";
import { translate } from "@/domain/data/translations";

type StatisticViewEditProps = 
{
  name: string;
  statistic: Statistic;
  icon: React.ReactNode;
  control: Control<UpsertCharacterStatisticsType>;
  fieldPath: StatisticPath;
};

export default function StatisticViewEdit({ name, statistic, icon, control, fieldPath }: StatisticViewEditProps) 
{
  const { grade, setGrade, value, setValue, bonus, setBonus, testBonus, setTestBonus } = useStatisticForm(control, fieldPath, statistic);

  return (
    <div className={'flex gap-x-2 items-center justify-around'}>

      <div className="capitalize">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ResetMultipleButton 
                variant='ghost' 
                valuesWithSetters=
                {
                  [
                    [statistic.bonus, setBonus],
                    [statistic.grade, setGrade],
                    [statistic.value, setValue],
                    [statistic.testBonus, setTestBonus]
                  ]
                }
                icon={icon}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{translate(name)}</p>
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