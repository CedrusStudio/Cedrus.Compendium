import { Defense } from '@/domain/Character';
import { Control, FieldPath } from "react-hook-form";
import { UpsertCharacterDefenseType, type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/components/ui/InputFormField";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';

type EditDefenseCardProps =
{
    defense: Defense;
    control: Control<UpsertCharacterCombatType>;
}

export default function EditDefenseCard(input: EditDefenseCardProps)
{
  const InputFormWithLabel = (defenseFieldName: keyof UpsertCharacterDefenseType) => 
  {   
    const fieldPath = `defense.${defenseFieldName}` as FieldPath<UpsertCharacterCombatType>;

    return (
      <div key={defenseFieldName} className={"flex flex-col items-center gap-2"}>

        <Label className="text-center capitalize">{defenseFieldName}</Label>

        <InputFormField<UpsertCharacterCombatType> 
          name={fieldPath} 
          control={input.control} 
          inputClassName="w-16 h-10 text-center font-medium" 
        />

      </div>
    );
  }

  return (
    <Card className='bg-muted border-2 shadow-md'>
        <CardContent className='p-6'>
          <CardTitle className='font-bold text-xl capitalize text-center text-primary mb-6'>
            Defense
          </CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          { 
            Object.keys(input.defense).map(key => InputFormWithLabel(key as keyof UpsertCharacterDefenseType)) 
          }
          </div>
        </CardContent>
    </Card>
  );
};