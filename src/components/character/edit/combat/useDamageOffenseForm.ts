import { DamageOffense } from "@/domain/Character";
import { useFormField } from "@/hooks/useFormField";
import { type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { type DamageOffensePath } from "@/components/character/edit/combat/EditOffenseCard";
import { setWithSideEffect } from "@/utils/global/setterUtils";
import { useState } from "react";

export function useDamageOffenseForm
(
  control: Control<UpsertCharacterCombatType>,
  fieldPath: DamageOffensePath,
  defaults: DamageOffense
) 
{
  const [amount, setAmount] = useState(defaults.amount);
  const [grade, setGrade] = useState(defaults.grade);
  const [bonus, setBonus] = useState(defaults.bonus);

  const amountField = useFormField(control, `${fieldPath}.amount`, defaults.amount);
  const gradeField = useFormField(control, `${fieldPath}.grade`, defaults.grade);
  const bonusField = useFormField(control, `${fieldPath}.bonus`, defaults.bonus);

  const resetAll = () =>
  {
    setAmount(defaults.amount);
    setGrade(defaults.grade);
    setBonus(defaults.bonus);
  };

  return { 
    amount,
    setAmount: setWithSideEffect(setAmount, amountField.onChange), 
    grade,
    setGrade: setWithSideEffect(setGrade, gradeField.onChange), 
    bonus, 
    setBonus: setWithSideEffect(setBonus, bonusField.onChange),
    resetAll
  };
}