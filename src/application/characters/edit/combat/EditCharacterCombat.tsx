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
import { useFieldArray, useForm } from "react-hook-form";
import { UpsertCharacterCombatType, upsertCharacterCombatSchema } from "@/persistence/characterSchemas";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";
import { Label } from "@radix-ui/react-label";
import { translate } from "@/presentation/translations";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import { CreateDefaultOffense } from "@/domain/characters/combat/Offense";
import { CreateDefaultDefense } from "@/domain/characters/combat/Defense";

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
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterCombat: UpsertCharacterCombatType) => await bffClient.upsertCharacter
    (
      character.id, { ...character, ...characterCombat }
    ), 
    {
      invalidateOnSuccess: ['characters', `characters/${character.id}`, `characters/${character.id}/edit`],
      toastPosition: "bottom-left",
    }
  );

  const { fields: offenses, append: appendOffense, remove: removeOffense } = useFieldArray<UpsertCharacterCombatType, "offenses">
  ({
      name: "offenses",
      control: form.control
  });

  const { fields: defenses, append: appendDefense, remove: removeDefense } = useFieldArray<UpsertCharacterCombatType, "defenses">
  ({
      name: "defenses",
      control: form.control
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3" id={combatFormName}>

        <div className="md:col-span-2">
          <EditHealthCard health={character.health} />
        </div>

        <div className="space-y-3 flex flex-col justify-center">

          <div className="flex justify-center items-center gap-3">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{translate("offenses")}</Label>
            <AppendToArrayButton<UpsertCharacterCombatType, "offenses"> 
              isPending={isPending}
              toAdd={CreateDefaultOffense}
              append={appendOffense}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
          {
            offenses.map((offense, index) => (<EditOffenseCard key={offense.id} offense={offense} index={index} remove={removeOffense} />))
          }
          </div>
        </div>
          
        <div className="space-y-3 flex flex-col justify-center">
          
          <div className="flex justify-center items-center gap-3">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{translate("defenses")}</Label>
            <AppendToArrayButton<UpsertCharacterCombatType, "defenses"> 
              isPending={isPending}
              toAdd={CreateDefaultDefense}
              append={appendDefense}
            />
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
          {
            defenses.map((defense, index) => <EditDefenseCard key={defense.id} defense={defense} index={index} remove={removeDefense} />)
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