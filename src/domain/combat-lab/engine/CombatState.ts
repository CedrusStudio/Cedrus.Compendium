/**
 * Mutable in-memory state of a single fight. Mutation is local to one
 * simulation run (see plan, Otwarte pytania #2: local mutation is chosen over
 * immutability for speed at 100k+ fights); the durable, shareable artifact is
 * the `CombatLog`, not this object.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { StatusId, DamageTick } from "@/domain/combat-lab/effects/Effect";
import type { Castable, EndTurn } from "@/domain/characters/Castable";

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

export type CombatantRuntime =
{
  snapshot: CombatantSnapshot;
  currentHp: number;
  barrier: number;
  statuses: ActiveStatus[];
  controls: ActiveControl[];
  /** Rounds spent at/below 0 hp (for the lethalRounds bleed-out rule). */
  roundsDowned: number;
  /**
   * Castables used so far this fight, with "end" markers between turns — the
   * exact shape `canUseCastable` expects (Castable.ts).
   */
  usedCastables: (Castable | EndTurn)[];
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
    roundsDowned: 0,
    usedCastables: [],
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
