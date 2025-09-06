"use client";

import { Statistic } from "@/domain/Character";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge";
import VerticalChangeButtons from "@/components/buttons/VerticalChangeButtons";
import ResetMultipleButton from "@/components/buttons/ResetMultipleButton";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control, useController } from "react-hook-form";

type StatisticViewEditProps = 
{
  name: string;
  statistic: Statistic;
  icon: React.ReactNode;
  control: Control<UpsertCharacterStatisticsType>;
  fieldPath: string;
};

export default function StatisticViewEdit({ name, statistic, icon, control, fieldPath }: StatisticViewEditProps) 
{
  const [grade, setGrade] = useState<number>(statistic.grade);
  const [value, setValue] = useState<number>(statistic.value);
  const [bonus, setBonus] = useState<number>(statistic.bonus);
  const [testBonus, setTestBonus] = useState<number>(statistic.testBonus);

  const { field: gradeField } = useController({
    name: `${fieldPath}.grade` as any,
    control,
    defaultValue: statistic.grade,
  });

  const { field: valueField } = useController({
    name: `${fieldPath}.value` as any,
    control,
    defaultValue: statistic.value,
  });

  const { field: bonusField } = useController({
    name: `${fieldPath}.bonus` as any,
    control,
    defaultValue: statistic.bonus,
  });

  const { field: testBonusField } = useController({
    name: `${fieldPath}.testBonus` as any,
    control,
    defaultValue: statistic.testBonus,
  });

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
                        [statistic.bonus, setBonus, gradeField.onChange],
                        [statistic.grade, setGrade, valueField.onChange],
                        [statistic.value, setValue, bonusField.onChange],
                        [statistic.testBonus, setTestBonus, testBonusField.onChange]
                    ]
                }
                icon={icon}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex items-center">

        <Tooltip>
          <TooltipTrigger>
            1k{grade * 2}
          </TooltipTrigger>
          <TooltipContent>
            <p>grade</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center">
          <VerticalChangeButtons setValue={setGrade} sideEffect={gradeField.onChange} />
        </div>
      </div>
      
      <div className="flex items-center">

        <Tooltip>
          <TooltipTrigger>
            <Badge className="rounded-full px-1 font-mono inline">{value}</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>value</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center">
          <VerticalChangeButtons setValue={setValue} sideEffect={valueField.onChange} />
        </div>
      </div>
      
      <div className="flex items-center">

        <Tooltip>
          <TooltipTrigger>
            {bonus}
          </TooltipTrigger>
          <TooltipContent>
            <p>bonus</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center">
          <VerticalChangeButtons setValue={setBonus} sideEffect={bonusField.onChange} />
        </div>
      </div>
      
      <div className="flex items-center">

        <Tooltip>
          <TooltipTrigger>
            {testBonus}
          </TooltipTrigger>
          <TooltipContent>
            <p>test bonus</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center">
          <VerticalChangeButtons setValue={setTestBonus} sideEffect={testBonusField.onChange} />
        </div>
      </div>

    </div>
  );
};