import { Statistic } from "@/domain/Character";
import { useFormField } from "@/hooks/useFormField";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { StatisticPath } from "@/components/character/edit/statistics/StatisticsCardEdit";
import { setWithSideEffect } from "@/utils/global/setterUtils";
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

  const gradeField = useFormField(control, `${fieldPath}.grade`, defaults.grade);
  const valueField = useFormField(control, `${fieldPath}.value`, defaults.value);
  const bonusField = useFormField(control, `${fieldPath}.bonus`, defaults.bonus);
  const testBonusField = useFormField(control, `${fieldPath}.testBonus`, defaults.testBonus);

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