"use client";

import EditHealthCard from "@/application/characters/edit/combat/EditHealthCard";
import EditDefenseCard from "@/application/characters/edit/combat/EditDefenseCard";
import EditOffenseCard from "@/application/characters/edit/combat/EditOffenseCard";
import EditStancesCard from "@/application/characters/edit/combat/EditStancesCard";
import EditStatesCard from "@/application/characters/edit/combat/EditStatesCard";
import EditManeuversCard from "@/application/characters/edit/combat/EditManeuversCard";
import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UpsertCharacterCombatType, upsertCharacterCombatSchema } from "@/persistence/characterSchemas";
import SubmitButton from "@/ui/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";
import { Label } from "@radix-ui/react-label";
import { translate } from "@/domain/data/translations";

type EditCharacterCombatProps =
{
  character: Character;
}

const combatFormName = "edit-combat-form";

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
    const initialValues: UpsertCharacterCombatType = 
    {
      defenses: character.defenses,
      health: character.health,
      stances: character.stances,
      states: character.states,
      maneuvers: character.maneuvers,
      offenses: character.offenses,
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
          offenses: characterCombat.offenses, 
          defenses: characterCombat.defenses, 
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 -mt-11" id={combatFormName}>

          <div className="md:col-span-2">
            <EditHealthCard health={character.health} />
          </div>

          <div className="space-y-3 flex flex-col justify-center">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{translate("offenses")}</Label>
            <div className="grid gap-3 md:grid-cols-2">
            {
              character.offenses.map((offense, index) => (
                <div key={index}>
                  <EditOffenseCard offense={offense} index={index} />
                </div>
              ))
            }
            </div>
          </div>
            
          <div className="space-y-3 flex flex-col justify-center">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{translate("defenses")}</Label>
            <div className="grid gap-3  md:grid-cols-2">
            {
              character.defenses.map((defense, index) => (
                <div key={index}>
                  <EditDefenseCard defense={defense} index={index} />
                </div>
              ))
            }
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <EditStancesCard isPending={isPending} />
            <EditStatesCard isPending={isPending} />
          </div>

          <EditManeuversCard isPending={isPending} />
          <SubmitButton isPending={isPending} />
        </form>
      </Form>
    );
};

