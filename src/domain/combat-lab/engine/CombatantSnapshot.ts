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
import type { Attributes } from "@/domain/characters/statistics/Attributes";
import type { Characteristics } from "@/domain/characters/statistics/Characteristics";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { toManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { applyActiveBuffProfile, applyBuffProfiles } from "@/domain/characters/buffs/applyBuffProfile";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { PowerSpecification } from "@/domain/characters/combat/Power";
import type { CastTime } from "@/domain/characters/Castable";
import { calculateSpellCost } from "@/domain/characters/combat/SpellCost";
import { calculateTotalHealthForCharacter } from "@/domain/characters/combat/Health";

/**
 * How a combatant's basic attack works:
 * - "melee"         → zwarcie, no to-hit roll, "zwyczajne" damage.
 * - "rangedPhysical" → łuk/kusza: precyzja to-hit test, "bezpośrednie" damage.
 * - "rangedMagic"    → magia dystansowa: precyzja to-hit test, "blokowane" damage.
 */
export type AttackKind = "melee" | "rangedPhysical" | "rangedMagic";

/**
 * A castable spell resolved to a combat action: its damage offense (from the
 * Power's PowerSpecification) plus the essence cost. Cast as a ranged-magic
 * attack ("blokowane") that costs essence (see magic-attacks plan).
 */
export type SnapshotSpell =
{
  id: string;
  name: string;
  offense: Offense;
  costEssence: number;
  castTime: CastTime;
  cooldown?: number;
};

/**
 * An active stance/state resolved for the simulation: its name, the starting
 * grade, and the rank family (effects per grade) so a rank-up can swap to the
 * grade+1 variant. Its effects are auto-cast at the start of every turn (see
 * engine-model-gaps §1). Built by the app layer from the loaded stance library.
 */
export type SnapshotMode =
{
  name: string;
  baseGrade: number;
  variantsByGrade: Record<number, Effect[]>;
};

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
  /** Castable damage spells resolved to combat actions (empty if none / no specs loaded). */
  spells: SnapshotSpell[];
  /** Active stance for this run (its effects are auto-cast each turn). */
  stance?: SnapshotMode;
  /** Active state for this run (independent slot from the stance). */
  state?: SnapshotMode;
  initiative: Statistic;
  /** Attack test stat (precyzja) for ranged attacks. */
  precision: Statistic;
  /** Defensive stat used as ranged to-hit ST (refleks). */
  reflex: Statistic;
  /**
   * Raw attributes + characteristics (post-buff) for contested tests (T2c).
   * `precision`/`initiative`/`reflex` above are duplicated here for convenience;
   * this is the full set a test pool (e.g. "fechtunek + walka wręcz") reads from.
   */
  skills: { attributes: Attributes; characteristics: Characteristics };
  /** Static positional context (set by the Scenario) read by `when` conditions. */
  positional?: { airborne?: boolean; charging?: boolean };
  /** Starting resource pools (mana/essence) for this simulation — a per-sim
   * parameter, not derived from the sheet. Consumed by `resource` effects and
   * the `hasResource` condition. Defaults to 0. */
  startingResources?: { mana?: number; essence?: number };
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
  /** Static positional context (set by the Scenario), read by `when` conditions. */
  positional?: { airborne?: boolean; charging?: boolean };
  /** Starting resource pools (mana/essence) for this simulation. */
  startingResources?: { mana?: number; essence?: number };
  /**
   * PowerSpecifications (by id) needed to resolve a character's spells into
   * damage offenses. The `Character` graph carries only `powerSpecificationId`
   * references, so these must be loaded separately and injected here. Without
   * them, `spells` is empty.
   */
  powerSpecifications?: Record<string, PowerSpecification>;
  /** Which PowerOffense (index) each power uses for its spells. Defaults to 0. */
  spellOffenseSelection?: Record<string, number>;
  /** Active stance/state for this run, pre-resolved to rank families by the app
   * layer (the character sheet doesn't carry them — chosen in the picker). */
  stance?: SnapshotMode;
  state?: SnapshotMode;
};

/** Build the castable spells for a character, resolving Power → spec → offense. */
function buildSpells(
  powers: Character["powers"],
  specs: Record<string, PowerSpecification> | undefined,
  selection: Record<string, number> | undefined,
): SnapshotSpell[]
{
  if (!specs) return [];
  const spells: SnapshotSpell[] = [];
  for (const power of powers)
  {
    const spec = specs[power.powerSpecificationId];
    if (!spec || spec.offenses.length === 0) continue;
    const index = Math.min(Math.max(0, selection?.[power.id] ?? 0), spec.offenses.length - 1);
    const po = spec.offenses[index]!;
    for (const spell of power.spells)
    {
      spells.push({
        id: spell.id,
        name: spell.name,
        offense: {
          id: `${spell.id}-off`,
          name: spell.name,
          leadingWeapon: po.spellOffense,
          secondaryWeapon: undefined,
          damageBonus: po.spellDamage,
          additionalDamageBonus: undefined,
        },
        // v1: cost at the power's level as spell strength (fixed cost ignores it).
        costEssence: calculateSpellCost(spell.cost, power.level ?? 1),
        castTime: spell.castTime,
        cooldown: spell.cooldown,
      });
    }
  }
  return spells;
}

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
    spells: buildSpells(buffed.powers, options.powerSpecifications, options.spellOffenseSelection),
    stance: options.stance,
    state: options.state,
    initiative: buffed.attributes.initiative,
    precision: buffed.attributes.precision,
    reflex: buffed.attributes.reflex,
    skills: { attributes: buffed.attributes, characteristics: buffed.characteristics },
    positional: options.positional,
    startingResources: options.startingResources,
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
