/**
 * The machine-readable form of a maneuver: the existing `Maneuver` (name,
 * grade, castTime, cooldown, price, tags, text description) enriched with the
 * structured `effects` the engine interprets and hard, checkable requirements.
 *
 * Stored on the `Maneuver` Prisma model as `effects Json?` (see the
 * implementation plan, "Kamień węgielny") — old records simply have no effects
 * yet and are backfilled editorially.
 */

import type { Maneuver } from "@/domain/characters/combat/Maneuver";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import type { CastTime } from "@/domain/characters/Castable";

/**
 * A requirement the engine can actually check, as opposed to the free-text
 * `Perk.requirements: string[]` (which is human-only). Used to decide whether a
 * combatant may use the maneuver, and by the Rules Validator to detect
 * unreachable maneuvers (no character can ever satisfy them).
 */
export type MechanicalRequirement =
  | { kind: "weapon"; value: string }
  | { kind: "shield" }
  | { kind: "statusOnTarget"; value: string }
  | { kind: "statusOnSelf"; value: string }
  | { kind: "minStat"; stat: string; value: number };

/**
 * Action cost, derived from the maneuver's `castTime` (the existing action
 * economy in Castable.ts) plus any optional resource cost. We do NOT introduce
 * a numeric "AP" — `castTime` + `CASTABLE_COMBINATION_PROFILES` remain the
 * source of truth for what fits in a turn.
 */
export type ActionCost =
{
  castTime: CastTime;
  mana?: number;
  essence?: number;
};

export type ManeuverDefinition = Maneuver &
{
  effects: Effect[];
  hardRequirements: MechanicalRequirement[];
  cost: ActionCost;
};

/**
 * Lift a `Maneuver` into a `ManeuverDefinition`, deriving `cost` from its
 * `castTime`. Authored `effects` flow straight through; a maneuver explicitly
 * marked `simulatable === false` is lifted with NO effects so the engine keeps
 * it in the action economy but it never produces a mechanical result (and the
 * policies never pick it). Legacy maneuvers with no authored effects also get
 * an empty list — the same "present but inert" behaviour as before.
 */
export function toManeuverDefinition(maneuver: Maneuver): ManeuverDefinition
{
  const effects = maneuver.simulatable === false ? [] : (maneuver.effects ?? []);

  return {
    ...maneuver,
    effects,
    hardRequirements: [],
    cost: { castTime: maneuver.castTime },
  };
}
