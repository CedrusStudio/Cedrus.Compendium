import { Defense } from '@/domain/characters/Character';
import { Control, FieldPath } from "react-hook-form";
import { UpsertCharacterDefenseType, type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/ui/InputFormField";
import { Label } from "@/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import { translate } from '@/domain/data/translations';

type EditDefenseCardProps =
{
    defense: Defense;
}

export default function EditDefenseCard(input: EditDefenseCardProps)
{
  const InputFormWithLabel = (defenseFieldName: keyof UpsertCharacterDefenseType) => 
  {   
    const fieldPath = `defense.${defenseFieldName}` as FieldPath<UpsertCharacterCombatType>;

    return (
      <div key={defenseFieldName} className={"flex flex-col items-center gap-2"}>

        <Label className="text-center capitalize">{translate(defenseFieldName)}</Label>
        <InputFormField<UpsertCharacterCombatType> name={fieldPath} inputClassName="w-16 h-10 text-center font-medium" />

      </div>
    );
  }

  return (
    <Card className='bg-muted border shadow-md'>
        <CardContent className='p-6'>
          
          <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary mb-6'>
              Defensywa
            </CardTitle>
          </CardHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          { 
            Object.keys(input.defense).map(key => InputFormWithLabel(key as keyof UpsertCharacterDefenseType)) 
          }
          </div>
        </CardContent>
    </Card>
  );
};