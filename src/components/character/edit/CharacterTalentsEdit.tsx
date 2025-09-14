"use client";

import {
  Form
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner"
import { useRouter } from 'next/navigation';
import { upsertCharacterTalentsSchema, type UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import { upsertCharacterTalents } from "@/persistence/characterRepository";
import SubmitButton from "@/components/ui/SubmitButton";

import { columns } from "@/components/character//edit/editTalentsColumns"
import { EditTalentsTable } from "@/components/character/edit/EditTalentsTable"
import { Character } from "@/domain/Character";
import { Button } from "@/components/ui/button";

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
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterTalents: UpsertCharacterTalentsType) => await upsertCharacterTalents(id, characterTalents),
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
            queryClient.invalidateQueries({ queryKey: [`characters/${id}/edit`] });
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

          <EditTalentsTable 
            columns={columns} 
            talents={character.talents} 
            control={form.control}
          />

          <SubmitButton isPending={isPending} />

          {/* Debug button to test handleSubmit directly */}
          <Button 
            type="button" 
            onClick={() => 
            {
                mutate(form.getValues());
                // const newTalents: Talent[] = Object.values(form.getValues());
                // const talentsArray = character.talents.map(t => newTalents.filter(nt => nt.id === t.id)[0] ?? t);
                // mutate(talentsArray);
            }}
          >
            Debug Submit
          </Button>
        </form>
    </Form>
  );
};