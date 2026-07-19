/**
 * Thin adapter over the EXISTING action economy in characters/Castable.ts.
 * The engine does not reinvent action points — it asks `canUseCastable` which
 * maneuvers still fit the turn (respecting cast-time combination profiles,
 * once-per-turn, and cooldowns), and records used castables in the same
 * `(Castable | "end")[]` shape that function expects.
 */

import type { Castable } from "@/domain/characters/Castable";
import { canUseCastable } from "@/domain/characters/Castable";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";

export type Action =
  | { kind: "attack" }
  | { kind: "maneuver"; maneuver: ManeuverDefinition }
  | { kind: "pass" };

/**
 * A basic weapon attack is modelled as a standard-action castable so it competes
 * for the same turn budget as maneuvers via `canUseCastable`.
 */
export const BASIC_ATTACK_CASTABLE: Castable =
{
  id: "__attack__",
  name: "__attack__",
  castTime: "Standardowa",
};

/** Every action the combatant may legally take right now (excluding "pass"). */
export function availableActions(runtime: CombatantRuntime): Action[]
{
  const actions: Action[] = [];

  if (canUseCastable(BASIC_ATTACK_CASTABLE, runtime.usedCastables))
  {
    actions.push({ kind: "attack" });
  }

  for (const maneuver of runtime.snapshot.maneuvers)
  {
    if (canUseCastable(maneuver, runtime.usedCastables))
    {
      actions.push({ kind: "maneuver", maneuver });
    }
  }

  return actions;
}

/** Record that an action was taken, updating the used-castable ledger. */
export function recordAction(runtime: CombatantRuntime, action: Action): void
{
  if (action.kind === "attack")
  {
    runtime.usedCastables.push(BASIC_ATTACK_CASTABLE);
  }
  else if (action.kind === "maneuver")
  {
    runtime.usedCastables.push(action.maneuver);
  }
}

/** Mark the end of a combatant's turn in its ledger. */
export function endTurnLedger(runtime: CombatantRuntime): void
{
  runtime.usedCastables.push("end");
}
