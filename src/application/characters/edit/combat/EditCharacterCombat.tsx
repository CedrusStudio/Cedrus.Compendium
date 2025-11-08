"use client";

import EditHealthCard from "@/application/characters/edit/combat/EditHealthCard";
import EditDefenseCard from "@/application/characters/edit/combat/EditDefenseCard";
import EditOffenseCard from "@/application/characters/edit/combat/EditOffenseCard";
import EditStancesCard from "@/application/characters/edit/combat/EditStancesCard";
import EditStatesCard from "@/application/characters/edit/combat/EditStatesCard";
import EditManeuversCard from "@/application/characters/edit/combat/EditManeuversCard";
import EditPowerCard from "@/application/characters/edit/combat/EditPowerCard";
import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { combatSchema, type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/charactersClient";
import { Label } from "@radix-ui/react-label";
import AppendToArrayButton from "@/common/components/form/AppendToArrayButton";
import { CreateDefaultOffense } from "@/domain/characters/combat/Offense";
import { CreateDefaultDefense } from "@/domain/characters/combat/Defense";
import { displayedText } from "@/presentation/translations";
import { CreateDefaultPower } from "@/domain/characters/combat/Power";
import { FORM_IDS, createCharacterCacheKeys } from "@/application/characters/edit/editFormConstants";

type EditCharacterCombatProps =
{
  character: Character;
}

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
  const initialValues: CombatDto = 
  {
    defenses: character.defenses,
    health: character.health,
    stances: character.stances,
    states: character.states,
    maneuvers: character.maneuvers,
    offenses: character.offenses,
    powers: character.powers,
    perks: character.perks
  };

  const form = useForm<CombatDto>
  ({
    resolver: zodResolver(combatSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const id = character.id;
  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterCombat: CombatDto) => await client.updateCombat(id, characterCombat),
    {
      invalidateOnSuccess: createCharacterCacheKeys(id),
      toastPosition: "bottom-left",
    }
  );

  const { fields: offenses, append: appendOffense, remove: removeOffense } = useFieldArray<CombatDto, "offenses">
  ({
    name: "offenses",
    control: form.control
  });

  const { fields: defenses, append: appendDefense, remove: removeDefense } = useFieldArray<CombatDto, "defenses">
  ({
    name: "defenses",
    control: form.control
  });

  const { fields: powers, append: appendPower, remove: removePower } = useFieldArray<CombatDto, "powers">
  ({
    name: "powers",
    control: form.control
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3" id={FORM_IDS.COMBAT}>

        <div className="lg:col-span-2">
          <EditHealthCard health={character.health} />
        </div>

        <div className="space-y-3 flex flex-col justify-center">

          <div className="flex justify-center items-center gap-3">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{displayedText.offenses}</Label>
            <AppendToArrayButton<CombatDto, "offenses"> 
              isPending={isPending}
              toAdd={CreateDefaultOffense}
              append={appendOffense}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
          {
            offenses.map((offense, index) => (<EditOffenseCard key={offense.id} offense={offense} index={index} remove={removeOffense} />))
          }
          </div>
        </div>
          
        <div className="space-y-3 flex flex-col justify-center">
          
          <div className="flex justify-center items-center gap-3">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{displayedText.defenses}</Label>
            <AppendToArrayButton<CombatDto, "defenses"> 
              isPending={isPending}
              toAdd={CreateDefaultDefense}
              append={appendDefense}
            />
          </div>
          
          <div className="grid gap-3 lg:grid-cols-2">
          {
            defenses.map((defense, index) => <EditDefenseCard key={defense.id} defense={defense} index={index} remove={removeDefense} />)
          }
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <EditStancesCard isPending={isPending} />
          <EditStatesCard isPending={isPending} />
        </div>

        <EditManeuversCard isPending={isPending} />

        <div className="space-y-3 flex flex-col justify-center">
          
          <div className="flex justify-center items-center gap-3">
            <Label className="font-bold text-2xl text-primary text-center capitalize">{displayedText.powers}</Label>
            <AppendToArrayButton<CombatDto, "powers"> 
              isPending={isPending}
              toAdd={CreateDefaultPower}
              append={appendPower}
            />
          </div>
          
          <div className="grid gap-3">
          {
            powers.map((power, index) => <EditPowerCard key={power.id} power={power} isPending={isPending} index={index} remove={removePower} />)
          }
          </div>
        </div>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};