/**
 * Thin adapter over the EXISTING action economy in characters/Castable.ts.
 * The engine does not reinvent action points — it asks `canUseCastable` which
 * maneuvers still fit the turn (respecting cast-time combination profiles,
 * once-per-turn, and cooldowns), and records used castables in the same
 * `(Castable | "end")[]` shape that function expects.
 */

import { canUseCastable } from "@/domain/characters/Castable";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import { isStaggered } from "@/domain/combat-lab/engine/CombatState";

export type Action =
  | { kind: "attack" }
  | { kind: "ranged" }
  | { kind: "maneuver"; maneuver: ManeuverDefinition }
  | { kind: "pass" };

/**
 * A maneuver is REACTIVE if it's an instant/over-instant cast time
 * (Natychmiastowa / Nadnatychmiastowa) — the rulebook allows those in response
 * to an opponent's attack, so they are NOT spent proactively in one's own turn.
 * Standardowa / Pełnorundowa maneuvers are proactive.
 */
export function isReactiveManeuver(maneuver: ManeuverDefinition): boolean
{
  return maneuver.castTime === "Natychmiastowa" || maneuver.castTime === "Nadnatychmiastowa";
}

/**
 * Proactive maneuvers usable right now (Standardowa / Pełnorundowa), governed by
 * `canUseCastable`. Used in the pre-attack phase of a turn — a maneuver may buff
 * or add damage BEFORE the attack, so maneuvers resolve first. Reactive
 * (instant) maneuvers are excluded here; they are reserved for responses.
 */
export function availableProactiveManeuvers(runtime: CombatantRuntime): Action[]
{
  if (isStaggered(runtime)) return [];

  const actions: Action[] = [];
  for (const maneuver of runtime.snapshot.maneuvers)
  {
    if (!isReactiveManeuver(maneuver) && canUseCastable(maneuver, runtime.usedCastables))
    {
      actions.push({ kind: "maneuver", maneuver });
    }
  }
  return actions;
}

/**
 * Reactive maneuvers usable right now (Natychmiastowa / Nadnatychmiastowa),
 * governed by `canUseCastable` (cooldown, once-per-turn, cast-time profile).
 * These are the maneuvers a combatant may use in RESPONSE to an opponent's
 * attack (see the reaction hook in runCombat). A staggered combatant can't.
 */
export function availableReactiveManeuvers(runtime: CombatantRuntime): Action[]
{
  if (isStaggered(runtime)) return [];

  const actions: Action[] = [];
  for (const maneuver of runtime.snapshot.maneuvers)
  {
    if (isReactiveManeuver(maneuver) && canUseCastable(maneuver, runtime.usedCastables))
    {
      actions.push({ kind: "maneuver", maneuver });
    }
  }
  return actions;
}

/**
 * Every action the combatant may legally take right now (excluding "pass").
 *
 * The basic attack is a SEPARATE action from maneuvers (rulebook): it is granted
 * once per turn independently of `canUseCastable`, so a combatant can attack AND
 * spend its full maneuver budget in the same turn. Maneuvers alone are governed
 * by `canUseCastable` against `usedCastables` (which no longer contains the
 * attack). Movement is a third independent action, not yet modelled in 1v1.
 */
export function availableActions(runtime: CombatantRuntime): Action[]
{
  const actions: Action[] = [];

  if (!runtime.attackedThisTurn)
  {
    // Basic attack is melee or ranged depending on the combatant's attackKind.
    actions.push(runtime.snapshot.attackKind === "melee" ? { kind: "attack" } : { kind: "ranged" });
  }

  // Oszołomienie blocks all maneuvers — only the basic attack remains.
  if (!isStaggered(runtime))
  {
    for (const maneuver of runtime.snapshot.maneuvers)
    {
      if (canUseCastable(maneuver, runtime.usedCastables))
      {
        actions.push({ kind: "maneuver", maneuver });
      }
    }
  }

  return actions;
}

/**
 * Record that an action was taken. The attack flips a per-turn flag (it is NOT
 * pushed onto the maneuver ledger); maneuvers are appended to `usedCastables`.
 */
export function recordAction(runtime: CombatantRuntime, action: Action): void
{
  if (action.kind === "attack" || action.kind === "ranged")
  {
    runtime.attackedThisTurn = true;
  }
  else if (action.kind === "maneuver")
  {
    runtime.usedCastables.push(action.maneuver);
  }
}

/** Mark the end of a combatant's turn: close the maneuver ledger and re-arm the attack. */
export function endTurnLedger(runtime: CombatantRuntime): void
{
  runtime.usedCastables.push("end");
  runtime.attackedThisTurn = false;
}
