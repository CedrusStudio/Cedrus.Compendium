"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { talentsSchema, type TalentsDto } from "@/persistence/schemas/characters/talentSchema";
import SubmitButton from "@/common/components/form/SubmitButton";
import { defaultColumns } from "@/application/characters/talents/defaultColumns"
import { EditTalentsTable } from "@/application/characters/edit/talents/EditTalentsTable"
import { Character } from "@/domain/characters/Character";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";

export default function EditCharacterTalents(input: { character: Character })
{
  const initialValues: TalentsDto = 
  {
    talents: input.character.talents
  };

  const form = useForm<TalentsDto>
  ({
    resolver: zodResolver(talentsSchema),
    defaultValues: initialValues,
  });
  
  const { character } = input;
  const id = character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterTalents: TalentsDto) => await bffClient.upsertCharacter(id, { ...character, talents: characterTalents.talents }),
    {
      invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`]
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditTalentsTable columns={defaultColumns} initialTalents={initialValues.talents} isPending={isPending}/>
        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};

