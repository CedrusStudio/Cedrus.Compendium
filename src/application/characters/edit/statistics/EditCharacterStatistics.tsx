"use client";

import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { statisticsSchema, type StatisticsDto } from "@/persistence/schemas/characters/statistics/statisticsSchema";
import EditStatisticsCard from "@/application/characters/edit/statistics/EditStatisticsCard";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/charactersClient";
import { createCharacterCacheKeys } from "@/application/characters/edit/editFormConstants";

export default function EditCharacterStatistics(input: { character: Character })
{
  const initialValues: StatisticsDto =
  {
    characteristics: input.character.characteristics,
    attributes: input.character.attributes,
  };

  const form = useForm<StatisticsDto>
  ({
    resolver: zodResolver(statisticsSchema),
    defaultValues: initialValues,
  })

  const { character } = input;
  const id = character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterStatistics: StatisticsDto) => await client.updateStatistics(id, characterStatistics),
    {
      invalidateOnSuccess: createCharacterCacheKeys(id)
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

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

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};