"use client";

/**
 * Non-blocking validation hint on the character sheet: given the character's
 * owned entities, flag how many have a decidable requirement the character does
 * NOT satisfy (via `checkRequirement`). Validates against the SAVED character
 * (loaded by id) — stats aren't editable on the combat form anyway. Renders
 * nothing when the character isn't loaded or everything is met.
 *
 * A HINT, never a gate: an unmet requirement must not stop the entity from
 * being added or kept. Giving a character something they do not qualify for can
 * be a deliberate narrative call, and that decision belongs to the GM.
 */

import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import { checkRequirement } from "@/domain/requirements/checkRequirement";
import type { Requirement } from "@/domain/requirements/Requirement";
import type { Character } from "@/domain/characters/Character";

type OwnedEntity = { name: string; structuredRequirements?: Requirement[] | null };

function unmetEntities(entities: readonly OwnedEntity[], character: Character): string[]
{
  return entities
    // Everything except `rankless` is decidable — including `anyOf` (unmet only
    // when NO option holds) and `sum`. Narrowing this to `kind === "ranked"`
    // would quietly stop warning about the composite variants.
    .filter((entity) => (entity.structuredRequirements ?? []).some((r) => r.kind !== "rankless" && !checkRequirement(r, character)))
    .map((entity) => entity.name);
}

export default function EntityRequirementsWarning({ characterId, entities }: { characterId: string; entities: readonly OwnedEntity[] })
{
  const ids = useMemo(() => (characterId ? [characterId] : []), [characterId]);
  const { byId } = useCharactersByIds(ids);
  const character = byId.get(characterId);

  const unmet = useMemo(() => (character ? unmetEntities(entities, character) : []), [character, entities]);

  if (!character || unmet.length === 0)
  {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-destructive/50 px-2 py-0.5 text-xs text-destructive"
      title={`Postać nie spełnia wymagań: ${unmet.join(", ")}`}
    >
      <TriangleAlert className="h-3.5 w-3.5" />
      {unmet.length} nie spełnia wymagań
    </span>
  );
}
