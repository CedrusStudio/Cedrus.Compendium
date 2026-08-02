/**
 * Mutable in-memory state of a single fight. Mutation is local to one
 * simulation run (see plan, Otwarte pytania #2: local mutation is chosen over
 * immutability for speed at 100k+ fights); the durable, shareable artifact is
 * the `CombatLog`, not this object.
 */

import type { CombatantSnapshot, SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { StatusId, DamageTick, RollModifierEffect, MultiplierEffect } from "@/domain/combat-lab/effects/Effect";
import type { Castable, EndTurn } from "@/domain/characters/Castable";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";

/** An active, ticking status on a combatant. */
export type ActiveStatus =
{
  status: StatusId;
  remaining: number;
  stacks: number;
  /** Per-round damage, copied from the applying `StatusEffect` if any. */
  tick?: DamageTick;
};

/** An active control (stun/root/…) that may prevent acting. */
export type ActiveControl =
{
  control: string;
  remaining: number;
};

/**
 * A buff/debuff profile currently affecting the combatant, with rounds left.
 * Applied to offense/defense at resolve time (a maneuver self-buff raises the
 * next attack), so nothing is baked destructively into the snapshot.
 */
export type ActiveBuff =
{
  profile: BuffProfile;
  remaining: number;
};

/** A damage multiplier in effect (procent / mnożnik), with rounds left. */
export type ActiveMultiplier =
{
  target: MultiplierEffect["target"];
  factor: number;
  rounding: "up" | "down" | "nearest";
  remaining: number;
};

/**
 * A live ban on everything carrying a library tag (Amok forbids „defensywne").
 * `remaining` counts rounds; a ban seeded with duration 0 lives exactly as long
 * as the mode that keeps re-applying it, and is cleared at the start of each
 * turn before the auto-cast re-seeds it.
 */
export type ActiveForbiddenTag =
{
  tag: string;
  scope: "maneuvers" | "stances" | "all";
  remaining: number;
};

/** An active stance/state with its temporary rank bump (from "podnieś rangę"). */
export type ActiveMode =
{
  mode: SnapshotMode;
  /** Authored grades of this mode's family, ascending (for clamping). */
  grades: number[];
  /** Temporary rank bonus (rounds tracked separately); resets when it expires. */
  rankBonus: number;
  /** Rounds the rank bonus lasts (0 = none active). */
  rankBonusRemaining: number;
};

export type CombatantRuntime =
{
  snapshot: CombatantSnapshot;
  currentHp: number;
  barrier: number;
  statuses: ActiveStatus[];
  controls: ActiveControl[];
  /** Buff/debuff profiles in effect, applied to offense/defense at resolve time. */
  activeBuffs: ActiveBuff[];
  /** Damage multipliers in effect (procent / mnożnik), applied post-reduction. */
  activeMultipliers: ActiveMultiplier[];
  /**
   * Roll modifiers (T2b) queued for THIS turn's attack — set by a `roll` effect
   * and consumed (cleared) by the next attack. Transient, not duration-based.
   */
  rollMods: RollModifierEffect[];
  /** Outcome of this combatant's most recent attack (for onCritical / onDamageDealt conditions). */
  lastAttack?: { critical: boolean; dealt: number };
  /** Spendable resource pool (essence), seeded from the snapshot. */
  resources: { essence: number };
  /** Rounds remaining before each spell (by id) can be cast again. Decremented per turn. */
  spellCooldowns: Record<string, number>;
  /** Rounds remaining during which THIS combatant's attacks cannot land a crit
   * ("nie można zadać krytycznych obrażeń"). 0 = crits allowed. */
  critSuppressedRemaining: number;
  /** Active stance/state (their effects are auto-cast at the start of each turn). */
  activeStance?: ActiveMode;
  activeState?: ActiveMode;
  /**
   * Stance-change bookkeeping (rulebook: changing stance is a move-like action,
   * once per turn, BEFORE the attack or AFTER it — never both).
   *
   * `stanceChangedThisTurn` closes the second window in the same turn.
   * `stanceChangeBlockedBeforeAttack` carries the cost of a post-attack change
   * into the next turn: the movement is understood to straddle the turn
   * boundary, so the pre-attack window there is already spent.
   */
  stanceChangedThisTurn: boolean;
  stanceChangeBlockedBeforeAttack: boolean;
  /** Library tags this combatant is currently locked out of (Amok: „defensywne"). */
  forbiddenTags: ActiveForbiddenTag[];
  /** Rounds spent at/below 0 hp (for the lethalRounds bleed-out rule). */
  roundsDowned: number;
  /**
   * Castables used so far this fight, with "end" markers between turns — the
   * exact shape `canUseCastable` expects (Castable.ts). Holds ONLY maneuvers,
   * not the basic attack: per the rulebook the attack action is independent of
   * the maneuver budget (see `attackedThisTurn`).
   */
  usedCastables: (Castable | EndTurn)[];
  /**
   * Whether the basic attack action has been used this turn. The attack is a
   * separate action from maneuvers (and from movement), so it does NOT go
   * through `canUseCastable` — a combatant may both attack AND spend its full
   * maneuver budget in the same turn. Reset each turn.
   */
  attackedThisTurn: boolean;
  initiativeRoll: number;
  alive: boolean;
};

export type CombatState =
{
  combatants: CombatantRuntime[];
  round: number;
};

export function createRuntime(snapshot: CombatantSnapshot): CombatantRuntime
{
  return {
    snapshot,
    currentHp: snapshot.maxHp,
    barrier: snapshot.barrier,
    statuses: [],
    controls: [],
    activeBuffs: [],
    activeMultipliers: [],
    rollMods: [],
    resources: { essence: snapshot.startingResources?.essence ?? 0 },
    spellCooldowns: {},
    critSuppressedRemaining: 0,
    activeStance: toActiveMode(snapshot.stance),
    activeState: toActiveMode(snapshot.state),
    stanceChangedThisTurn: false,
    stanceChangeBlockedBeforeAttack: false,
    forbiddenTags: [],
    roundsDowned: 0,
    usedCastables: [],
    attackedThisTurn: false,
    initiativeRoll: 0,
    alive: true,
  };
}

/** Build the runtime active-mode wrapper from a snapshot stance/state (if any). */
function toActiveMode(mode: SnapshotMode | undefined): ActiveMode | undefined
{
  if (!mode) return undefined;
  const grades = Object.keys(mode.variantsByGrade).map(Number).sort((a, b) => a - b);
  return { mode, grades, rankBonus: 0, rankBonusRemaining: 0 };
}

export function findRuntime(state: CombatState, id: string): CombatantRuntime | undefined
{
  return state.combatants.find(c => c.snapshot.id === id);
}

export function livingCombatants(state: CombatState): CombatantRuntime[]
{
  return state.combatants.filter(c => c.alive);
}

/** A combatant can act unless it is knocked out or under a hard control. */
export function canAct(runtime: CombatantRuntime): boolean
{
  if (!runtime.alive) return false;
  return !runtime.controls.some(c => c.control === "stun");
}

/**
 * Oszołomienie (stagger). Rulebook (podstawy.json): a staggered combatant loses
 * maneuvers and postures, has half parry/dodge/block, and attacks with one fewer
 * weapon die. Wired into actionEconomy (no maneuvers), resolveAttack (−1 die /
 * halved guards) and applyEffect (halved guards).
 */
export function isStaggered(runtime: CombatantRuntime): boolean
{
  return runtime.statuses.some(s => s.status === "stagger");
}

/** The buff/debuff profiles currently in effect on a combatant. */
export function activeBuffProfiles(runtime: CombatantRuntime): BuffProfile[]
{
  return runtime.activeBuffs.map(b => b.profile);
}
