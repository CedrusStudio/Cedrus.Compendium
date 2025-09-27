"use client";

import {
  Form
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertCharacterTalentsSchema, type UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import { upsertCharacterTalents } from "@/persistence/characterRepository";
import SubmitButton from "@/components/ui/SubmitButton";

import { columns } from "@/components/character//edit/talents/editTalentsColumns"
import { EditTalentsTable } from "@/components/character/edit/talents/EditTalentsTable"
import { Character } from "@/domain/Character";
import { useCallback } from "react";
import { useFormMutation } from "@/hooks/useFormMutation";

export default function CharacterTalentsEdit(input: { character: Character })
{
    const initialValues: UpsertCharacterTalentsType = input.character.talents;

    const form = useForm<UpsertCharacterTalentsType>
    ({
        resolver: zodResolver(upsertCharacterTalentsSchema),
        defaultValues: initialValues
    });

    const { character } = input;
    const id = character.id;

    const mutationFn = useCallback
    (
        async (characterTalents: UpsertCharacterTalentsType) => await upsertCharacterTalents(id, characterTalents),
        [id]
    );

    const { handleSubmit, isPending } = useFormMutation(mutationFn, 
    {
        form,
        initialValues,
        invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`]
    });

    const handleSubmitCapture: React.FormEventHandler<HTMLFormElement> = () =>
    {
        const newTalents = Object.values(form.getValues());
        const talentsArray = character.talents.map(t => newTalents.filter(nt => nt.id === t.id)[0] ?? t);
        form.reset(talentsArray);
    };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} onSubmitCapture={handleSubmitCapture} className="space-y-8">

          <EditTalentsTable 
            columns={columns} 
            talents={character.talents} 
            control={form.control}
          />

          <SubmitButton isPending={isPending} />
        </form>
    </Form>
  );
};