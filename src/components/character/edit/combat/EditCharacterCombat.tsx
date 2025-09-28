"use client";

import EditHealthCard from "@/components/character/edit/combat/EditHealthCard";
import EditDefenseCard from "@/components/character/edit/combat/EditDefenseCard";
import EditOffenseCard from "@/components/character/edit/combat/EditOffenseCard";
import EditStancesCard from "@/components/character/edit/combat/EditStancesCard";
import EditStatesCard from "@/components/character/edit/combat/EditStatesCard";
import EditManeuversCard from "@/components/character/edit/combat/EditManeuversCard";

import { Character } from "@/domain/Character";
import {
  Form
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { UpsertCharacterCombatType, upsertCharacterCombatSchema } from "@/persistence/characterSchemas";
import SubmitButton from "@/components/ui/SubmitButton";
import { upsertCharacterCombat } from "@/persistence/characterRepository";
import { useCallback, useEffect, useMemo } from "react";
import { useFormMutation } from "@/hooks/useFormMutation";

type EditCharacterCombatProps =
{
    character: Character;
}

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
    const initialValues: UpsertCharacterCombatType = useMemo(() => (
    {
        defense: character.defense,
        health: character.health,
    }), [character.defense, character.health]);

    const form = useForm<UpsertCharacterCombatType>
    ({
        resolver: zodResolver(upsertCharacterCombatSchema),
        defaultValues: initialValues,
        mode: "onBlur",
    })
    
    useEffect(() => 
    {
      form.reset(initialValues);
    }, [initialValues, form]);

    const mutationFn = useCallback
    (
      async (characterCombat: UpsertCharacterCombatType) => await upsertCharacterCombat(character.id, characterCombat),
      [character.id]
    );

    const { handleSubmit, isPending } = useFormMutation(mutationFn, 
    {
      form,
      initialValues,
      invalidateOnSuccess: ['characters', `characters/${character.id}`],
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

          <p className='text-xl text-center text-primary pt-2 capitalize font-semibold'>
              {character.name}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <EditHealthCard health={character.health} control={form.control} />
            <EditDefenseCard defense={character.defense} control={form.control} />
          </div>

          <EditOffenseCard offense={character.offense} control={form.control} />

          <div className="grid gap-3 md:grid-cols-2">
            <EditStancesCard stances={character.stances} control={form.control} />
            <EditStatesCard states={character.states} control={form.control} />
          </div>
          
          <EditManeuversCard maneuvers={character.maneuvers} control={form.control} />

          <SubmitButton isPending={isPending} />
        </form>
      </Form>
    );
};
