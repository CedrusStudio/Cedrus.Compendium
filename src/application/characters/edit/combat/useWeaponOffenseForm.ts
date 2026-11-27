import { type WeaponOffensePath, WeaponOffense } from "@/domain/characters/combat/Offense";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { Control, useController, useFormContext } from "react-hook-form";
import { setWithSideEffect } from "@/common/global/setterUtils";
import { useState } from "react";

export function useWeaponOffenseForm
(
  control: Control<CombatDto>,
  fieldPath: WeaponOffensePath,
  defaults: WeaponOffense
) 
{
  const { setValue } = useFormContext<CombatDto>();
  const [criticalPower, setCriticalPower] = useState(defaults.critical.power);
  const [criticalRange, setCriticalRange] = useState(defaults.critical.range);
  const [amount, setAmount] = useState(defaults.amount);
  const [grade, setGrade] = useState(defaults.grade);
  const [bonus, setBonus] = useState(defaults.bonus);
  const [isPhantom, setIsPhantom] = useState(defaults.isPhantom);

  const { field: criticalPowerField } = useController({ name: `${fieldPath}.critical.power`, control, defaultValue: defaults.critical.power });
  const { field: criticalRangeField } = useController({ name: `${fieldPath}.critical.range`, control, defaultValue: defaults.critical.range });
  const { field: amountField } = useController({ name: `${fieldPath}.amount`, control, defaultValue: defaults.amount });
  const { field: gradeField } = useController({ name: `${fieldPath}.grade`, control, defaultValue: defaults.grade });
  const { field: bonusField } = useController({ name: `${fieldPath}.bonus`, control, defaultValue: defaults.bonus });
  const { field: isPhantomField } = useController({ name: `${fieldPath}.isPhantom`, control, defaultValue: defaults.isPhantom });

  const resetAll = () =>
  {
    setValue(fieldPath, defaults, { shouldDirty: true });
    setCriticalPower(defaults.critical.power);
    setCriticalRange(defaults.critical.range);
    setAmount(defaults.amount);
    setGrade(defaults.grade);
    setBonus(defaults.bonus);
    setIsPhantom(defaults.isPhantom);
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
    isPhantom,
    setIsPhantom: setWithSideEffect(setIsPhantom, isPhantomField.onChange),
    resetAll
  };
}
