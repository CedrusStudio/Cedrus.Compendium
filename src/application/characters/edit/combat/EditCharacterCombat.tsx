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
import { CreateDefaultOffense } from "@/domain/characters/combat/Offense";
import { CreateDefaultDefense } from "@/domain/characters/combat/Defense";
import { displayedText } from "@/common/translations";
import { CreateDefaultPower } from "@/domain/characters/combat/Power";
import EditArraySection from "@/common/components/form/EditArraySection";
import { useCharacterForm } from "@/application/characters/edit/hooks/useCharacterForm";
import { useMembershipGuardedUpdate } from '../hooks/useMembershipGuardedUpdate';

type EditCharacterCombatProps =
{
  character: Character;
}

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
  const updateCombat = useMembershipGuardedUpdate(character, 'combat');
  const { form, handleSubmit, isPending, isSuccess, formId } = useCharacterForm<CombatDto>
  ({
    characterId: character.id,
    tab: "combat",
    schema: combatSchema,
    defaultValues: 
    {
      defenses: character.defenses,
      defaultDefenseId: character.defaultDefenseId,
      health: character.health,
      stances: character.stances,
      states: character.states,
      maneuvers: character.maneuvers,
      offenses: character.offenses,
      defaultOffenseId: character.defaultOffenseId,
      powers: character.powers
    },
    updateFn: updateCombat,
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
          <EditStancesCard isPending={isPending} isSuccess={isSuccess} initialStances={character.stances} currentCharacterId={character.id} currentCharacterName={character.name} />
          <EditStatesCard isPending={isPending} isSuccess={isSuccess} initialStates={character.states} currentCharacterId={character.id} currentCharacterName={character.name} />
        </div>

        <EditManeuversCard isPending={isPending} isSuccess={isSuccess} initialManeuvers={character.maneuvers} currentCharacterId={character.id} currentCharacterName={character.name} />

        <EditArraySection<CombatDto, "powers">
          title={displayedText.powers}
          fieldArray={useFieldArray({ name: "powers", control: form.control })}
          createDefault={CreateDefaultPower}
          isPending={isPending}
          renderItem={(power, index, remove) => <EditPowerCard key={power.id} power={power} isPending={isPending} isSuccess={isSuccess} index={index} remove={remove} currentCharacterId={character.id} currentCharacterName={character.name} /> }
          gridCols={1}
        />
      </form>
    </Form>
  );
};
