"use client";

import { Form } from "@/ui/form";
import { talentsSchema, type TalentsDto } from "@/persistence/schemas/characters/talentSchema";
import { defaultColumns } from "@/application/characters/talents/defaultColumns"
import { EditTalentsTable } from "@/application/characters/edit/talents/EditTalentsTable"
import { Character } from "@/domain/characters/Character";
import client from "@/infrastructure/clients/charactersClient";
import { useCharacterForm } from "@/application/characters/edit/hooks/useCharacterForm";

export default function EditCharacterTalents(input: { character: Character })
{
  const { character } = input;

  const { form, handleSubmit, formId } = useCharacterForm<TalentsDto>
  ({
    characterId: character.id,
    tab: "talents",
    schema: talentsSchema,
    defaultValues: 
    {
      talents: character.talents
    },
    updateFn: client.updateTalents,
  });

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)}>
        <EditTalentsTable columns={defaultColumns} initialTalents={character.talents} />
      </form>
    </Form>
  );
};

