"use client";

import { DataCard } from '@/common/components/cards/DataCard';
import { displayedText } from "@/presentation/translations";
import { FieldPath } from "react-hook-form";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { type HealthDto } from "@/persistence/schemas/characters/combat/healthSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import { Health } from "@/domain/characters/combat/Health";
import { Label } from "@/ui/label";

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
      className='border shadow-md'
      headerClassName='mb-6'
      contentClassName="grid grid-cols-2 lg:grid-cols-4 gap-6"
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
    <div key={healthFieldName} className={"flex flex-col items-center gap-2"}>
      <Label className="text-center capitalize">{displayedText[healthFieldName as keyof typeof displayedText]}</Label>
      <InputFormField<CombatDto> path={fieldPath} inputClassName="w-16 h-10 text-center font-medium" />
    </div>
  );
}
