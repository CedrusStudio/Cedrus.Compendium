import { Talent } from "@/domain/Character";
import { useFormField } from "@/hooks/useFormField";
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { useState } from "react";
import { AllowedTalentRoots } from "@/components/character/edit/talents/EditTalentRow";
import { singleValueSetterWithSideEffectFactory } from "@/utils/setterUtils";

export function useTalentForm
(
  control: Control<UpsertCharacterTalentsType>,
  index: number,
  defaults: Talent
) 
{
  const [talent, setTalent] = useState(defaults);
  const talentField = useFormField(control, `${index}`, defaults);

  return { 
    talent,
    talentSetterFactory: singleValueSetterWithSideEffectFactory<Talent, AllowedTalentRoots>(setTalent, talentField.onChange)
  };
}