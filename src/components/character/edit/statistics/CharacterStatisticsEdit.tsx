"use client";

import { Character } from "@/domain/Character";
import {
  Form
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner"
import { useRouter } from 'next/navigation';
import { attributesIcons, characteristicIcons } from "@/utils/icons";
import { upsertCharacterStatisticsSchema, type UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { upsertCharacterStatistics } from "@/persistence/characterRepository";
import StatisticsCardEdit from "@/components/character/edit/statistics/StatisticsCardEdit";
import SubmitButton from "@/components/ui/SubmitButton";

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
    const queryClient = useQueryClient();
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterStatistics: UpsertCharacterStatisticsType) => await upsertCharacterStatistics(id, characterStatistics),
        onSuccess: () => 
        {
            toast("Success", 
            {
                description: (
                    <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">{JSON.stringify("Character updated successfully", null, 2)}</code>
                    </pre>
                )
            });

            queryClient.invalidateQueries({ queryKey: ['characters'] });
            queryClient.invalidateQueries({ queryKey: [`characters/${id}`] });
            form.reset(initialValues);

            router.refresh();
        },
        onError: (error) => 
        {
            toast("Error", 
            {
                description: (
                    <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">{JSON.stringify(error.message, null, 2)}</code>
                    </pre>
                )
            });
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(values => mutate(values))} className="space-y-8">

                <div className="grid gap-3 md:grid-cols-2">
                  <StatisticsCardEdit 
                    title="Characteristics" 
                    statistics={Object.entries(character.characteristics).map(([name, value]) => [name, value, characteristicIcons[name]])} 
                    control={form.control}
                  />

                  <StatisticsCardEdit 
                    title="Attributes" 
                    statistics={Object.entries(character.attributes).map(([name, value]) => [name, value, attributesIcons[name]])} 
                    control={form.control}
                  />
                </div>

                <SubmitButton isPending={isPending} />
            </form>
        </Form>
    );
};