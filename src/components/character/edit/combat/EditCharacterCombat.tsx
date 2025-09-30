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

const combatFormName = "edit-combat-form";

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
    const initialValues: UpsertCharacterCombatType = useMemo(() => (
    {
        defense: character.defense,
        health: character.health,
        stances: character.stances,
        states: character.states,
        maneuvers: character.maneuvers
    }), [character.defense, character.health, character.stances, character.states, character.maneuvers]);

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
      toastPosition: "bottom-left",
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id={combatFormName}>

          <div className="grid gap-3 md:grid-cols-7">

            <div className="md:col-span-2">
              <EditHealthCard health={character.health} control={form.control} />
            </div>
            
            <div className="md:col-span-3">
              <EditOffenseCard offense={character.offense} control={form.control} />
            </div>
            
            <div className="md:col-span-2">
              <EditDefenseCard defense={character.defense} control={form.control} />
            </div>

          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <EditStancesCard stances={character.stances} control={form.control} isPending={isPending} combatFormName={combatFormName} />
            <EditStatesCard states={character.states} control={form.control} isPending={isPending} combatFormName={combatFormName} />
          </div>

          <EditManeuversCard maneuvers={character.maneuvers} control={form.control} isPending={isPending} combatFormName={combatFormName} />

          <SubmitButton isPending={isPending} />
        </form>
      </Form>
    );
};
