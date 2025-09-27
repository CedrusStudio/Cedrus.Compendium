import { Statistic } from "@/domain/Character";
import { useFormNumberField } from "@/hooks/useFormNumberField";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { PathsFrom } from "@/utils/pathTypes";
import { Control } from "react-hook-form";

// Only allow paths inside these roots
type AllowedRoots = "characteristics" | "attributes";
type StatsRoot = Pick<UpsertCharacterStatisticsType, AllowedRoots>;

// Public type: e.g., "characteristics.strength" | "attributes.agility"
export type StatisticPath = PathsFrom<StatsRoot, Statistic>;

export function useStatisticFields
(
  control: Control<UpsertCharacterStatisticsType>,
  fieldPath: StatisticPath,
  defaults: Statistic
) 
{
  const grade = useFormNumberField(control, `${fieldPath}.grade`, defaults.grade);
  const value = useFormNumberField(control, `${fieldPath}.value`, defaults.value);
  const bonus = useFormNumberField(control, `${fieldPath}.bonus`, defaults.bonus);
  const testBonus = useFormNumberField(control, `${fieldPath}.testBonus`, defaults.testBonus);

  const resetAll = () => 
  {
    grade.reset(); 
    value.reset(); 
    bonus.reset(); 
    testBonus.reset();
  };

  return { 
    grade, 
    value, 
    bonus, 
    testBonus,
    resetAll 
  };
}