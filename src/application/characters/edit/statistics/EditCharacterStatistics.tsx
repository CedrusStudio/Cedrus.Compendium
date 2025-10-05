"use client";

import { Character } from "@/domain/Character";
import {
  Form
} from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertCharacterStatisticsSchema, type UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import EditStatisticsCard from "@/application/characters/edit/statistics/EditStatisticsCard";
import SubmitButton from "@/ui/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";

export default function EditCharacterStatistics(input: { character: Character })
{
  const initialValues: UpsertCharacterStatisticsType =
  {
    characteristics: input.character.characteristics,
    attributes: input.character.attributes,
  };

  const form = useForm<UpsertCharacterStatisticsType>
  ({
    resolver: zodResolver(upsertCharacterStatisticsSchema),
    defaultValues: initialValues,
  })

  const { character } = input;
  const id = character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterStatistics: UpsertCharacterStatisticsType) => await bffClient.upsertCharacter
    (
      id, 
      { ...character, characteristics: characterStatistics.characteristics, attributes: characterStatistics.attributes }
    ),
    {
      initialValues,
      invalidateOnSuccess: ['characters', `characters/${id}`]
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

        <div className="grid gap-3 md:grid-cols-2">
          <EditStatisticsCard 
            title="characteristics" 
            statistics={character.characteristics}
            control={form.control}
          />

          <EditStatisticsCard 
            title="attributes" 
            statistics={character.attributes}
            control={form.control}
          />
        </div>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};