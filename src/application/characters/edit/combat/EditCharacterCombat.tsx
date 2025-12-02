"use client";

import EditHealthCard from "@/application/characters/edit/combat/EditHealthCard";
import EditDefenseCard from "@/application/characters/edit/combat/EditDefenseCard";
import EditOffenseCard from "@/application/characters/edit/combat/offense/EditOffenseCard";
import EditStancesCard from "@/application/characters/edit/combat/EditStancesCard";
import EditStatesCard from "@/application/characters/edit/combat/EditStatesCard";
import EditManeuversCard from "@/application/characters/edit/combat/EditManeuversCard";
import EditPowerCard from "@/application/characters/edit/combat/EditPowerCard";
import { Character } from "@/domain/characters/Character";
import { Form } from "@/ui/form";
import { useFieldArray } from "react-hook-form";
import { combatSchema, type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import SubmitButton from "@/common/components/form/SubmitButton";
import client from "@/infrastructure/clients/charactersClient";
import { CreateDefaultOffense } from "@/domain/characters/combat/Offense";
import { CreateDefaultDefense } from "@/domain/characters/combat/Defense";
import { displayedText } from "@/presentation/translations";
import { CreateDefaultPower } from "@/domain/characters/combat/Power";
import { FORM_IDS } from "@/application/characters/edit/editFormConstants";
import EditArraySection from "@/common/components/form/EditArraySection";
import { useCharacterForm } from "@/application/characters/edit/hooks/useCharacterForm";

type EditCharacterCombatProps =
{
  character: Character;
}

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
  const { form, handleSubmit, isPending, formId } = useCharacterForm<CombatDto>
  ({
    characterId: character.id,
    schema: combatSchema,
    defaultValues: 
    {
      defenses: character.defenses,
      health: character.health,
      stances: character.stances,
      states: character.states,
      maneuvers: character.maneuvers,
      offenses: character.offenses,
      powers: character.powers
    },
    updateFn: client.updateCombat,
    formId: FORM_IDS.COMBAT,
    toastPosition: "bottom-left",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3" id={formId}>

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