"use client";

import { Character } from "@/domain/Character";
import {
  Form
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { upsertCharacterStatisticsSchema, type UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { upsertCharacterStatistics } from "@/persistence/characterRepository";
import StatisticsCardEdit from "@/components/character/edit/statistics/StatisticsCardEdit";
import SubmitButton from "@/components/ui/SubmitButton";
import { useCallback } from "react";
import { useFormMutation } from "@/hooks/useFormMutation";

export default function CharacterStatisticsEdit(input: { character: Character })
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

    const mutationFn = useCallback
    (
        async (characterStatistics: UpsertCharacterStatisticsType) => await upsertCharacterStatistics(id, characterStatistics),
        [id]
    );

    const { handleSubmit, isPending } = useFormMutation(mutationFn, 
    {
        form,
        initialValues,
        invalidateOnSuccess: ['characters', `characters/${id}`]
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

                <div className="grid gap-3 md:grid-cols-2">
                  <StatisticsCardEdit 
                    title="characteristics" 
                    statistics={character.characteristics}
                    control={form.control}
                  />

                  <StatisticsCardEdit 
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