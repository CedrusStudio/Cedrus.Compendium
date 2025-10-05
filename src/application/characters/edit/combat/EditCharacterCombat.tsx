"use client";

import EditHealthCard from "@/application/characters/edit/combat/EditHealthCard";
import EditDefenseCard from "@/application/characters/edit/combat/EditDefenseCard";
import EditOffenseCard from "@/application/characters/edit/combat/EditOffenseCard";
import EditStancesCard from "@/application/characters/edit/combat/EditStancesCard";
import EditStatesCard from "@/application/characters/edit/combat/EditStatesCard";
import EditManeuversCard from "@/application/characters/edit/combat/EditManeuversCard";

import { Character } from "@/domain/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { UpsertCharacterCombatType, upsertCharacterCombatSchema } from "@/persistence/characterSchemas";
import SubmitButton from "@/ui/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";

type EditCharacterCombatProps =
{
    character: Character;
}

const combatFormName = "edit-combat-form";

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
    const initialValues: UpsertCharacterCombatType = 
    {
      defense: character.defense,
      health: character.health,
      stances: character.stances,
      states: character.states,
      maneuvers: character.maneuvers,
      offense: character.offense,
    };

    const form = useForm<UpsertCharacterCombatType>
    ({
        resolver: zodResolver(upsertCharacterCombatSchema),
        defaultValues: initialValues,
        mode: "onBlur",
    })

    const { handleSubmit, isPending } = useFormMutation
    (
      async (characterCombat: UpsertCharacterCombatType) => await bffClient.upsertCharacter
      (
        character.id, 
        { 
          ...character, 
          offense: characterCombat.offense, 
          defense: characterCombat.defense, 
          health: characterCombat.health, 
          stances: characterCombat.stances, 
          states: characterCombat.states, 
          maneuvers: characterCombat.maneuvers 
        }
      ), 
      {
        invalidateOnSuccess: ['characters', `characters/${character.id}`, `characters/${character.id}/edit`],
        toastPosition: "bottom-left",
      }
    );

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
            <EditStancesCard control={form.control} isPending={isPending} />
            <EditStatesCard control={form.control} isPending={isPending} />
          </div>

          <EditManeuversCard control={form.control} isPending={isPending} />

          <SubmitButton isPending={isPending} />
        </form>
      </Form>
    );
};

