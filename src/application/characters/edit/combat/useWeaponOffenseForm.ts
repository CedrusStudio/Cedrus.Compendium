import { WeaponOffense } from "@/domain/Character";
import { type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control, useController } from "react-hook-form";
import { type WeaponOffensePath } from "@/application/characters/edit/combat/EditOffenseCard";
import { setWithSideEffect } from "@/common/global/setterUtils";
import { useState } from "react";

export function useWeaponOffenseForm
(
  control: Control<UpsertCharacterCombatType>,
  fieldPath: WeaponOffensePath,
  defaults: WeaponOffense
) 
{
  const [criticalPower, setCriticalPower] = useState(defaults.critical.power);
  const [criticalRange, setCriticalRange] = useState(defaults.critical.range);
  const [amount, setAmount] = useState(defaults.amount);
  const [grade, setGrade] = useState(defaults.grade);
  const [bonus, setBonus] = useState(defaults.bonus);

  const { field: criticalPowerField } = useController({ name: `${fieldPath}.critical.power`, control, defaultValue: defaults.critical.power });
  const { field: criticalRangeField } = useController({ name: `${fieldPath}.critical.range`, control, defaultValue: defaults.critical.range });
  const { field: amountField } = useController({ name: `${fieldPath}.amount`, control, defaultValue: defaults.amount });
  const { field: gradeField } = useController({ name: `${fieldPath}.grade`, control, defaultValue: defaults.grade });
  const { field: bonusField } = useController({ name: `${fieldPath}.bonus`, control, defaultValue: defaults.bonus });

  const resetAll = () =>
  {
    setCriticalPower(defaults.critical.power);
    setCriticalRange(defaults.critical.range);
    setAmount(defaults.amount);
    setGrade(defaults.grade);
    setBonus(defaults.bonus);
  };

  return { 
    power: criticalPower,
    setPower: setWithSideEffect(setCriticalPower, criticalPowerField.onChange), 
    range: criticalRange,
    setRange: setWithSideEffect(setCriticalRange, criticalRangeField.onChange), 
    amount,
    setAmount: setWithSideEffect(setAmount, amountField.onChange), 
    grade,
    setGrade: setWithSideEffect(setGrade, gradeField.onChange), 
    bonus, 
    setBonus: setWithSideEffect(setBonus, bonusField.onChange),
    resetAll
  };
}