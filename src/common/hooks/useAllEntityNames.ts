"use client";

import { useMemo } from "react";
import { useEntityNames } from "@/common/hooks/useEntityNames";
import type { EntityNameOptions } from "@/domain/requirements/suggestRequirementMapping";

/**
 * Names for every requirement-target group at once — used to seed the matcher.
 *
 * `talents` matters as much as the compendium groups: „spostrzegawczość 5" and
 * „zastraszanie 4" are Talents, and without them here the matcher has no way to
 * recognise the text and silently offers no suggestion.
 */
export function useAllEntityNames(): EntityNameOptions
{
  const perks = useEntityNames("perks");
  const spells = useEntityNames("spells");
  const maneuvers = useEntityNames("maneuvers");
  const stances = useEntityNames("stances");
  const states = useEntityNames("states");
  const talents = useEntityNames("talents");

  return useMemo(
    () => ({
      perks: perks.names,
      spells: spells.names,
      maneuvers: maneuvers.names,
      stances: stances.names,
      states: states.names,
      talents: talents.names,
    }),
    [perks.names, spells.names, maneuvers.names, stances.names, states.names, talents.names],
  );
}
