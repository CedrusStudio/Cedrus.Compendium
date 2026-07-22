/**
 * Mutable in-memory state of a single fight. Mutation is local to one
 * simulation run (see plan, Otwarte pytania #2: local mutation is chosen over
 * immutability for speed at 100k+ fights); the durable, shareable artifact is
 * the `CombatLog`, not this object.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { StatusId, DamageTick, RollModifierEffect } from "@/domain/combat-lab/effects/Effect";
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

export type CombatantRuntime =
{
  snapshot: CombatantSnapshot;
  currentHp: number;
  barrier: number;
  statuses: ActiveStatus[];
  controls: ActiveControl[];
  /** Buff/debuff profiles in effect, applied to offense/defense at resolve time. */
  activeBuffs: ActiveBuff[];
  /**
   * Roll modifiers (T2b) queued for THIS turn's attack — set by a `roll` effect
   * and consumed (cleared) by the next attack. Transient, not duration-based.
   */
  rollMods: RollModifierEffect[];
  /** Outcome of this combatant's most recent attack (for onCritical / onDamageDealt conditions). */
  lastAttack?: { critical: boolean; dealt: number };
  /** Spendable resource pools (mana/essence), seeded from the snapshot. */
  resources: { mana: number; essence: number };
  /** Rounds remaining before each spell (by id) can be cast again. Decremented per turn. */
  spellCooldowns: Record<string, number>;
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
    rollMods: [],
    resources: { mana: snapshot.startingResources?.mana ?? 0, essence: snapshot.startingResources?.essence ?? 0 },
    spellCooldowns: {},
    roundsDowned: 0,
    usedCastables: [],
    attackedThisTurn: false,
    initiativeRoll: 0,
    alive: true,
  };
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
