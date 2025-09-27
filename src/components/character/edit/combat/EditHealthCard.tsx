"use client";

import { Control, FieldPath } from "react-hook-form";
import { UpsertCharacterHealthType, type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/components/ui/InputFormField";
import { Health } from "@/domain/Character";

type EditHealthCardProps =
{
  health: Health;
  control: Control<UpsertCharacterCombatType>;
}

export default function EditHealthCard(input: EditHealthCardProps)
{
  const InputFormWithLabel = (healthFieldName: keyof UpsertCharacterHealthType) => 
  {   
    const fieldPath = `health.${healthFieldName}` as FieldPath<UpsertCharacterCombatType>;

    return (
      <InputFormField<UpsertCharacterCombatType> 
        key={healthFieldName} 
        name={fieldPath} 
        control={input.control} 
        inputClassName="w-14" 
        addLabel 
      />
    );
  }

  return (
    <>
      <div className="">
      { 
        Object.keys(input.health).map(key => InputFormWithLabel(key as keyof UpsertCharacterHealthType)) 
      }
      </div>
    </>
  );
};
