import { Statistic } from "@/domain/Character";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control, useController } from "react-hook-form";
import { StatisticPath } from "@/application/characters/edit/statistics/StatisticsCardEdit";
import { setWithSideEffect } from "@/common/global/setterUtils";
import { useState } from "react";

export function useStatisticForm
(
  control: Control<UpsertCharacterStatisticsType>,
  fieldPath: StatisticPath,
  defaults: Statistic
) 
{
  const [grade, setGrade] = useState(defaults.grade);
  const [value, setValue] = useState(defaults.value);
  const [bonus, setBonus] = useState(defaults.bonus);
  const [testBonus, setTestBonus] = useState(defaults.testBonus);

  const { field: gradeField } = useController({ name: `${fieldPath}.grade`, control, defaultValue: defaults.grade });
  const { field: valueField } = useController({ name: `${fieldPath}.value`, control, defaultValue: defaults.value });
  const { field: bonusField } = useController({ name: `${fieldPath}.bonus`, control, defaultValue: defaults.bonus });
  const { field: testBonusField } = useController({ name: `${fieldPath}.testBonus`, control, defaultValue: defaults.testBonus });

  return { 
    grade,
    setGrade: setWithSideEffect(setGrade, gradeField.onChange), 
    value, 
    setValue: setWithSideEffect(setValue, valueField.onChange), 
    bonus, 
    setBonus: setWithSideEffect(setBonus, bonusField.onChange),
    testBonus,
    setTestBonus: setWithSideEffect(setTestBonus, testBonusField.onChange),
  };
}