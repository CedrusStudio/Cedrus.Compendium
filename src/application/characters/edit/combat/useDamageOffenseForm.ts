import { DamageOffense } from "@/domain/Character";
import { type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, useController } from "react-hook-form";
import { type DamageOffensePath } from "@/application/characters/edit/combat/EditOffenseCard";
import { setWithSideEffect } from "@/common/global/setterUtils";
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

  const { field: amountField } = useController({ name: `${fieldPath}.amount`, control, defaultValue: defaults.amount });
  const { field: gradeField } = useController({ name: `${fieldPath}.grade`, control, defaultValue: defaults.grade });
  const { field: bonusField } = useController({ name: `${fieldPath}.bonus`, control, defaultValue: defaults.bonus });

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