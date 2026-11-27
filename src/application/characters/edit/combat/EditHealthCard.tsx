"use client";

import { DataCard } from '@/common/components/cards/DataCard';
import { displayedText } from "@/common/translations";
import { FieldPath } from "react-hook-form";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { type HealthDto } from "@/persistence/schemas/characters/combat/healthSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import { Health } from "@/domain/characters/combat/Health";

type EditHealthCardProps =
{
  health: Health;
}

export default function EditHealthCard(input: EditHealthCardProps)
{
  return (
    <DataCard 
      title={displayedText.health} 
      variant="muted"
      className="@container gap-3 py-4 shadow-md"
      headerClassName="justify-items-center px-4"
      contentClassName="grid grid-cols-2 items-start gap-x-2 gap-y-4 px-4 @md:grid-cols-4 @2xl:grid-cols-[repeat(7,auto)] [&_label]:min-h-8 [&_label]:justify-center [&_label]:leading-4 [&_label]:hyphens-auto [&_label]:[overflow-wrap:anywhere]"
    >
      { 
        Object.keys(input.health).map(key => InputFormWithLabel(key as keyof HealthDto)) 
      }
    </DataCard>
  );
};

function InputFormWithLabel(healthFieldName: keyof HealthDto)
{   
  const fieldPath = `health.${healthFieldName}` as FieldPath<CombatDto>;

  return (
    <InputFormField<CombatDto> key={healthFieldName} path={fieldPath} numeric
      label={displayedText[healthFieldName]} inputClassName="w-16 h-10 text-center font-medium" />
  );
}
