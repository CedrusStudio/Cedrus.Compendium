import { PowerOffense } from "@/domain/characters/combat/Power";
import { PowerSpecificationDto } from "@/persistence/schemas/characters/combat/powerSchema";
import { Control, useController } from "react-hook-form";
import { setWithSideEffect } from "@/common/global/setterUtils";
import { useState } from "react";

export function usePowerOffenseForm
(
  control: Control<PowerSpecificationDto>,
  offenseIndex: number,
  defaults: PowerOffense
) 
{
  // SpellOffense (WeaponOffense) state
  const [spellOffensePower, setSpellOffensePower] = useState(defaults.spellOffense.critical.power);
  const [spellOffenseRange, setSpellOffenseRange] = useState(defaults.spellOffense.critical.range);
  const [spellOffenseAmount, setSpellOffenseAmount] = useState(defaults.spellOffense.amount);
  const [spellOffenseGrade, setSpellOffenseGrade] = useState(defaults.spellOffense.grade);
  const [spellOffenseBonus, setSpellOffenseBonus] = useState(defaults.spellOffense.bonus);
  const [spellOffenseIsPhantom, setSpellOffenseIsPhantom] = useState(defaults.spellOffense.isPhantom);

  // SpellDamage (DamageOffense) state
  const [spellDamageAmount, setSpellDamageAmount] = useState(defaults.spellDamage.amount);
  const [spellDamageGrade, setSpellDamageGrade] = useState(defaults.spellDamage.grade);
  const [spellDamageBonus, setSpellDamageBonus] = useState(defaults.spellDamage.bonus);
  const [spellDamageIsPhantom, setSpellDamageIsPhantom] = useState(defaults.spellDamage.isPhantom);

  // SpellOffense field controllers
  const { field: spellOffensePowerField } = useController({ 
    name: `offenses.${offenseIndex}.spellOffense.critical.power`, 
    control, 
    defaultValue: defaults.spellOffense.critical.power 
  });

  const { field: spellOffenseRangeField } = useController({ 
    name: `offenses.${offenseIndex}.spellOffense.critical.range`, 
    control, 
    defaultValue: defaults.spellOffense.critical.range 
  });

  const { field: spellOffenseAmountField } = useController({ 
    name: `offenses.${offenseIndex}.spellOffense.amount`, 
    control, 
    defaultValue: defaults.spellOffense.amount 
  });

  const { field: spellOffenseGradeField } = useController({ 
    name: `offenses.${offenseIndex}.spellOffense.grade`, 
    control, 
    defaultValue: defaults.spellOffense.grade 
  });

  const { field: spellOffenseBonusField } = useController({ 
    name: `offenses.${offenseIndex}.spellOffense.bonus`, 
    control, 
    defaultValue: defaults.spellOffense.bonus 
  });

  const { field: spellOffenseIsPhantomField } = useController({ 
    name: `offenses.${offenseIndex}.spellOffense.isPhantom`, 
    control, 
    defaultValue: defaults.spellOffense.isPhantom 
  });

  // SpellDamage field controllers
  const { field: spellDamageAmountField } = useController({ 
    name: `offenses.${offenseIndex}.spellDamage.amount`, 
    control, 
    defaultValue: defaults.spellDamage.amount 
  });

  const { field: spellDamageGradeField } = useController({ 
    name: `offenses.${offenseIndex}.spellDamage.grade`, 
    control, 
    defaultValue: defaults.spellDamage.grade 
  });

  const { field: spellDamageBonusField } = useController({ 
    name: `offenses.${offenseIndex}.spellDamage.bonus`, 
    control, 
    defaultValue: defaults.spellDamage.bonus 
  });

  const { field: spellDamageIsPhantomField } = useController({ 
    name: `offenses.${offenseIndex}.spellDamage.isPhantom`, 
    control, 
    defaultValue: defaults.spellDamage.isPhantom 
  });

  return { 
    spellOffense: {
      power: spellOffensePower,
      setPower: setWithSideEffect(setSpellOffensePower, spellOffensePowerField.onChange),
      range: spellOffenseRange,
      setRange: setWithSideEffect(setSpellOffenseRange, spellOffenseRangeField.onChange),
      amount: spellOffenseAmount,
      setAmount: setWithSideEffect(setSpellOffenseAmount, spellOffenseAmountField.onChange),
      grade: spellOffenseGrade,
      setGrade: setWithSideEffect(setSpellOffenseGrade, spellOffenseGradeField.onChange),
      bonus: spellOffenseBonus,
      setBonus: setWithSideEffect(setSpellOffenseBonus, spellOffenseBonusField.onChange),
      isPhantom: spellOffenseIsPhantom,
      setIsPhantom: setWithSideEffect(setSpellOffenseIsPhantom, spellOffenseIsPhantomField.onChange),
    },
    spellDamage: {
      amount: spellDamageAmount,
      setAmount: setWithSideEffect(setSpellDamageAmount, spellDamageAmountField.onChange),
      grade: spellDamageGrade,
      setGrade: setWithSideEffect(setSpellDamageGrade, spellDamageGradeField.onChange),
      bonus: spellDamageBonus,
      setBonus: setWithSideEffect(setSpellDamageBonus, spellDamageBonusField.onChange),
      isPhantom: spellDamageIsPhantom,
      setIsPhantom: setWithSideEffect(setSpellDamageIsPhantom, spellDamageIsPhantomField.onChange),
    }
  };
}
