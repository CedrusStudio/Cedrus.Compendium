"use client";

import {
  Form
} from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertCharacterTalentsSchema, type UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import SubmitButton from "@/ui/SubmitButton";

import { defaultColumns } from "@/application/characters/talents/defaultColumns"
import { EditTalentsTable } from "@/application/characters/edit/talents/EditTalentsTable"
import { Character } from "@/domain/Character";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";

export default function EditCharacterTalents(input: { character: Character })
{
  const initialValues: UpsertCharacterTalentsType = 
  {
    talents: input.character.talents
  };

  const form = useForm<UpsertCharacterTalentsType>
  ({
    resolver: zodResolver(upsertCharacterTalentsSchema),
    defaultValues: initialValues
  });
  
  const { character } = input;
  const id = character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterTalents: UpsertCharacterTalentsType) => await bffClient.upsertCharacter(id, { ...character, talents: characterTalents.talents }),
    {
      initialValues,
      invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`]
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditTalentsTable columns={defaultColumns} initialTalents={initialValues.talents} control={form.control} isPending={isPending}/>
        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};