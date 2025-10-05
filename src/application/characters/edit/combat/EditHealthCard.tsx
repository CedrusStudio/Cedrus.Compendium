"use client";

import { FieldPath } from "react-hook-form";
import { UpsertCharacterHealthType, type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/ui/InputFormField";
import { Health } from "@/domain/characters/Character";
import { Label } from "@/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import { translate } from "@/domain/data/translations";

type EditHealthCardProps =
{
  health: Health;
}

export default function EditHealthCard(input: EditHealthCardProps)
{
  const InputFormWithLabel = (healthFieldName: keyof UpsertCharacterHealthType) => 
  {   
    const fieldPath = `health.${healthFieldName}` as FieldPath<UpsertCharacterCombatType>;

    return (
      <div key={healthFieldName} className={"flex flex-col items-center gap-2"}>

        <Label className="text-center capitalize">{translate(healthFieldName)}</Label>
        <InputFormField<UpsertCharacterCombatType> name={fieldPath} inputClassName="w-16 h-10 text-center font-medium" />

      </div>
    );
  }

  return (
    <Card className='bg-muted border shadow-md'>
        <CardContent className='p-6'>
          
          <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary mb-6'>
              Życie
            </CardTitle>
          </CardHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          { 
            Object.keys(input.health).map(key => InputFormWithLabel(key as keyof UpsertCharacterHealthType)) 
          }
          </div>

        </CardContent>
    </Card>
  );
};
