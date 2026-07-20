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
import { applyActiveBuffProfile, applyBuffProfiles } from "@/domain/characters/buffs/applyBuffProfile";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { calculateTotalHealthForCharacter } from "@/domain/characters/combat/Health";

/**
 * How a combatant's basic attack works:
 * - "melee"         → zwarcie, no to-hit roll, "zwyczajne" damage.
 * - "rangedPhysical" → łuk/kusza: precyzja to-hit test, "bezpośrednie" damage.
 * - "rangedMagic"    → magia dystansowa: precyzja to-hit test, "blokowane" damage.
 */
export type AttackKind = "melee" | "rangedPhysical" | "rangedMagic";

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
  /** Attack test stat (precyzja) for ranged attacks. */
  precision: Statistic;
  /** Defensive stat used as ranged to-hit ST (refleks). */
  reflex: Statistic;
  attackKind: AttackKind;
  /**
   * The character's buff-profile library — referenced by `buff`/`debuff`
   * effects (by id) so the engine can apply them at runtime. These are NOT
   * pre-applied; only profiles a maneuver activates take effect (see
   * applyEffect + ActiveBuff).
   */
  buffProfiles: BuffProfile[];
};

export type SnapshotOptions =
{
  /**
   * Override the maneuver definitions (with authored `effects`). If omitted,
   * the character's plain maneuvers are lifted with empty effects — they still
   * participate in the action economy but produce no mechanical effect.
   */
  maneuverDefinitions?: ManeuverDefinition[];
  /** Basic-attack mode. Defaults to "melee". */
  attackKind?: AttackKind;
  /**
   * Per-simulation buffs (point 6). Replace WHICH of the character's own buff
   * profiles are active for this run — independent of what's toggled on the
   * saved character. If omitted, the character's own `activeBuffProfileIds` apply.
   */
  overrideActiveBuffProfileIds?: string[];
  /**
   * Extra, temporary buff profiles applied on top (e.g. a simulation-only
   * "+2 siły" experiment). Applied after the active profiles, just like the
   * app's existing buff mechanism.
   */
  extraBuffProfiles?: BuffProfile[];
};

/**
 * Build a `CombatantSnapshot` from a character, baking in active modifiers.
 */
export function toCombatantSnapshot(character: Character, options: SnapshotOptions = {}): CombatantSnapshot
{
  // Per-simulation buffs: optionally override which profiles are active, then
  // layer any extra temporary profiles on top.
  const withActiveOverride = options.overrideActiveBuffProfileIds
    ? { ...character, activeBuffProfileIds: options.overrideActiveBuffProfileIds }
    : character;

  let buffed = applyActiveBuffProfile(withActiveOverride);
  if (options.extraBuffProfiles && options.extraBuffProfiles.length > 0)
  {
    buffed = applyBuffProfiles(buffed, options.extraBuffProfiles);
  }

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
    precision: buffed.attributes.precision,
    reflex: buffed.attributes.reflex,
    attackKind: options.attackKind ?? "melee",
    buffProfiles: buffed.buffProfiles,
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
