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
import { CreateDefaultOffense } from "@/domain/characters/combat/Offense";
import { CreateDefaultDefense } from "@/domain/characters/combat/Defense";
import { displayedText } from "@/presentation/translations";
import { CreateDefaultPower } from "@/domain/characters/combat/Power";
import { FORM_IDS, createCharacterCacheKeys } from "@/application/characters/edit/editFormConstants";
import EditArraySection from "@/common/components/form/EditArraySection";

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3" id={FORM_IDS.COMBAT}>

        <div className="lg:col-span-2">
          <EditHealthCard health={character.health} />
        </div>

        <EditArraySection<CombatDto, "offenses">
          title={displayedText.offenses}
          fieldArray={useFieldArray({ name: "offenses", control: form.control })}
          createDefault={CreateDefaultOffense}
          isPending={isPending}
          renderItem={(offense, index, remove) => <EditOffenseCard key={offense.id} offense={offense} index={index} remove={remove} /> }
        />
          
        <EditArraySection<CombatDto, "defenses">
          title={displayedText.defenses}
          fieldArray={useFieldArray({ name: "defenses", control: form.control })}
          createDefault={CreateDefaultDefense}
          isPending={isPending}
          renderItem={(defense, index, remove) => <EditDefenseCard key={defense.id} defense={defense} index={index} remove={remove} />}
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <EditStancesCard isPending={isPending} />
          <EditStatesCard isPending={isPending} />
        </div>

        <EditManeuversCard isPending={isPending} />

        <EditArraySection<CombatDto, "powers">
          title={displayedText.powers}
          fieldArray={useFieldArray({ name: "powers", control: form.control })}
          createDefault={CreateDefaultPower}
          isPending={isPending}
          renderItem={(power, index, remove) => <EditPowerCard key={power.id} power={power} isPending={isPending} index={index} remove={remove} /> }
          gridCols={1}
        />

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};