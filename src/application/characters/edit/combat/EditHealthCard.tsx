"use client";

import { DataCard } from '@/common/components/cards/DataCard';
import { displayedText } from "@/common/translations";
import { useNumericField } from "@cedrus/react-forms";
import { useFormContext } from "react-hook-form";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { type HealthDto } from "@/persistence/schemas/characters/combat/healthSchema";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
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
        Object.keys(input.health).map(key => <HealthField key={key} name={key as keyof HealthDto} />)
      }
    </DataCard>
  );
};

function HealthField({ name }: { name: keyof HealthDto })
{
  const { control } = useFormContext<CombatDto>();
  const { labelProps, inputProps, messageProps, message } = useNumericField({ control, name: `health.${name}` as const });
  return (
    <div className="w-full flex justify-center gap-2">
      <div className="grid gap-2 min-w-0 max-w-full justify-items-center">
        <Label {...labelProps} data-error={inputProps["aria-invalid"]} className="text-center capitalize data-[error=true]:text-form-error">
          {displayedText[name]}
        </Label>
        <Input {...inputProps} numeric className="w-16 h-10 text-center font-medium" />
        {message && <p {...messageProps} className="text-form-error text-sm">{message}</p>}
      </div>
    </div>
  );
}
