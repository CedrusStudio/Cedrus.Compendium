"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { statisticsSchema, type StatisticsDto } from "@/persistence/schemas/characters/statistics/statisticsSchema";
import EditStatisticsCard from "@/application/characters/edit/statistics/EditStatisticsCard";
import client from "@/infrastructure/clients/charactersClient";
import { useCharacterForm } from "@/application/characters/edit/hooks/useCharacterForm";

export default function EditCharacterStatistics(input: { character: Character })
{
  const { character } = input;

  const { form, handleSubmit, formId } = useCharacterForm<StatisticsDto>
  ({
    characterId: character.id,
    tab: "statistics",
    schema: statisticsSchema,
    defaultValues: 
    {
      characteristics: character.characteristics,
      attributes: character.attributes,
    },
    updateFn: client.updateStatistics,
  });

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

        <div className="flex flex-col lg:grid gap-3 lg:grid-cols-2">
          <EditStatisticsCard 
            title="characteristics" 
            statistics={character.characteristics}
          />

          <EditStatisticsCard 
            title="attributes" 
            statistics={character.attributes}
          />
        </div>
      </form>
    </Form>
  );
};