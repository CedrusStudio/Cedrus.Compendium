"use client";

import EditHealthCard from "@/components/character/edit/combat/EditHealthCard";
import EditDefenseCard from "@/components/character/edit/combat/EditDefenseCard";

import { Character } from "@/domain/Character";
import {
  Form
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner"
import { useRouter } from 'next/navigation';
import { UpsertCharacterCombatType, upsertCharacterCombatSchema } from "@/persistence/characterSchemas";
import SubmitButton from "@/components/ui/SubmitButton";
import { upsertCharacterCombat } from "@/persistence/characterRepository";

type EditCharacterCombatProps =
{
    character: Character;
}

export default function EditCharacterCombat(input: EditCharacterCombatProps)
{
    const initialValues: UpsertCharacterCombatType =
    {
        defense: input.character.defense,
        health: input.character.health,
    };

    console.log("Initial Values: ", initialValues);

    const form = useForm<UpsertCharacterCombatType>
    ({
        resolver: zodResolver(upsertCharacterCombatSchema),
        defaultValues: initialValues,
    })

    const { character } = input;
    const id = character.id;
    const queryClient = useQueryClient();
    const router = useRouter();
    
    const { mutate, isPending } = useMutation
    ({
      mutationFn: async (characterCombat: UpsertCharacterCombatType) => await upsertCharacterCombat(id, characterCombat),
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

          <p className='text-xl text-center text-primary pt-2 capitalize font-semibold'>
              {input.character.name}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <EditHealthCard health={character.health} control={form.control} />
            <EditDefenseCard defense={character.defense} control={form.control} />
          </div>

          <SubmitButton isPending={isPending} />
        </form>
      </Form>
    );
};
