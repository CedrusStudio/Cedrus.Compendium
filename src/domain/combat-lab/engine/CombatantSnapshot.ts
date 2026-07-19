/**
 * A flattened, simulation-ready copy of a character. All buff/stance/state
 * modifiers are baked in up-front (via `applyActiveBuffProfile`), health is
 * pre-computed, and maneuvers are resolved to `ManeuverDefinition`s so the
 * engine never has to touch the rich `Character` graph during the hot loop.
 *
 * Layering note (refinement of the plan): the snapshot is built from a pure
 * `Character`, NOT from `createDuplicatedCharacter` (which lives in the
 * application layer, `bestiary/battle/BattleCombatants.ts`). Importing that into
 * the domain would invert the dependency direction. The application-layer picker
 * is free to pass an already-duplicated character in.
 */

import type { Character } from "@/domain/characters/Character";
import type { Defense } from "@/domain/characters/combat/Defense";
import type { Offense } from "@/domain/characters/combat/Offense";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { toManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { applyActiveBuffProfile } from "@/domain/characters/buffs/applyBuffProfile";
import { calculateTotalHealthForCharacter } from "@/domain/characters/combat/Health";

export type CombatantSnapshot =
{
  id: string;
  name: string;
  /** Full health pool at the start of the fight. */
  maxHp: number;
  /** Separate absorb pool consumed before hp (Health.barrier). */
  barrier: number;
  /** Rounds a downed combatant can keep fighting before dying (Health.lethalRounds). */
  lethalRounds: number;
  /** Extra health below zero before death (Health.lethalHealth). */
  lethalHealth: number;
  defenses: Defense[];
  defaultDefenseId?: string;
  offenses: Offense[];
  defaultOffenseId?: string;
  maneuvers: ManeuverDefinition[];
  initiative: Statistic;
};

export type SnapshotOptions =
{
  /**
   * Override the maneuver definitions (with authored `effects`). If omitted,
   * the character's plain maneuvers are lifted with empty effects — they still
   * participate in the action economy but produce no mechanical effect.
   */
  maneuverDefinitions?: ManeuverDefinition[];
};

/**
 * Build a `CombatantSnapshot` from a character, baking in active modifiers.
 */
export function toCombatantSnapshot(character: Character, options: SnapshotOptions = {}): CombatantSnapshot
{
  const buffed = applyActiveBuffProfile(character);

  const maneuvers =
    options.maneuverDefinitions ?? buffed.maneuvers.map(toManeuverDefinition);

  return {
    id: buffed.id,
    name: buffed.name,
    maxHp: calculateTotalHealthForCharacter(buffed),
    barrier: buffed.health.barrier,
    lethalRounds: buffed.health.lethalRounds,
    lethalHealth: buffed.health.lethalHealth,
    defenses: buffed.defenses,
    defaultDefenseId: buffed.defaultDefenseId,
    offenses: buffed.offenses,
    defaultOffenseId: buffed.defaultOffenseId,
    maneuvers,
    initiative: buffed.attributes.initiative,
  };
}

/** The offense a combatant leads with (default, or the first available). */
export function selectDefaultOffense(snapshot: CombatantSnapshot): Offense | undefined
{
  if (snapshot.offenses.length === 0) return undefined;
  const byDefault = snapshot.defaultOffenseId
    ? snapshot.offenses.find(o => o.id === snapshot.defaultOffenseId)
    : undefined;
  return byDefault ?? snapshot.offenses[0];
}

/** The defense a combatant guards with (default, or the first available). */
export function selectDefaultDefense(snapshot: CombatantSnapshot): Defense | undefined
{
  if (snapshot.defenses.length === 0) return undefined;
  const byDefault = snapshot.defaultDefenseId
    ? snapshot.defenses.find(d => d.id === snapshot.defaultDefenseId)
    : undefined;
  return byDefault ?? snapshot.defenses[0];
}
