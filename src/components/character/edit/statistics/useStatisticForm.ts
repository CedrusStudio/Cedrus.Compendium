import { Statistic } from "@/domain/Character";
import { useFormNumberField } from "@/hooks/useFormNumberField";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { StatisticPath } from "@/components/character/edit/statistics/StatisticsCardEdit";
import { setWithSideEffect } from "@/utils/setterUtils";
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

  const gradeField = useFormNumberField(control, `${fieldPath}.grade`, defaults.grade);
  const valueField = useFormNumberField(control, `${fieldPath}.value`, defaults.value);
  const bonusField = useFormNumberField(control, `${fieldPath}.bonus`, defaults.bonus);
  const testBonusField = useFormNumberField(control, `${fieldPath}.testBonus`, defaults.testBonus);

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