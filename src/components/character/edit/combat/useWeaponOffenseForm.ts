import { WeaponOffense } from "@/domain/Character";
import { useFormField } from "@/hooks/useFormField";
import { type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { type WeaponOffensePath } from "@/components/character/edit/combat/EditOffenseCard";
import { setWithSideEffect } from "@/utils/global/setterUtils";
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

  const criticalPowerField = useFormField(control, `${fieldPath}.critical.power`, defaults.critical.power);
  const criticalRangeField = useFormField(control, `${fieldPath}.critical.range`, defaults.critical.range);
  const amountField = useFormField(control, `${fieldPath}.amount`, defaults.amount);
  const gradeField = useFormField(control, `${fieldPath}.grade`, defaults.grade);
  const bonusField = useFormField(control, `${fieldPath}.bonus`, defaults.bonus);

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