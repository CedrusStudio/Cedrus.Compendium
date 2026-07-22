/**
 * Serializable, turn-by-turn record of a single fight. This is the ONLY durable
 * artifact of a simulation (see plan, Otwarte pytania #2): because the engine is
 * deterministic, Combat Replay renders the log without re-running anything.
 *
 * Every event is a plain, JSON-serializable object (a discriminated union on
 * `kind`) so logs can be persisted (`Json`) and streamed to the replay UI.
 */

import type { StatusId, DamageType } from "@/domain/combat-lab/effects/Effect";

export type CombatEndReason = "knockout" | "lethal" | "timeout" | "draw";

export type CombatEvent =
  | { kind: "combatStart"; seed: number; combatants: { id: string; name: string; maxHp: number }[] }
  | { kind: "initiative"; order: { id: string; roll: number }[] }
  | { kind: "roundStart"; round: number }
  | { kind: "turnStart"; round: number; actorId: string }
  | { kind: "attack"; actorId: string; targetId: string; raw: number; reduced: number; dealt: number; critical: boolean; remainingHp: number; resistance: number; reduction: number; immunityDice: number }
  | { kind: "rangedAttack"; actorId: string; targetId: string; hit: boolean; attackRoll: number; st: number; raw: number; reduced: number; dealt: number; critical: boolean; remainingHp: number }
  | { kind: "spellCast"; actorId: string; targetId: string; spellId: string; spellName: string; hit: boolean; attackRoll: number; st: number; raw: number; reduced: number; dealt: number; critical: boolean; remainingHp: number; costEssence: number; remainingEssence: number }
  | { kind: "maneuver"; actorId: string; targetId: string; maneuverId: string; maneuverName: string }
  | { kind: "reaction"; actorId: string; targetId: string; maneuverId: string; maneuverName: string }
  | { kind: "damage"; sourceId: string; targetId: string; amount: number; damageType: DamageType; remainingHp: number }
  | { kind: "heal"; sourceId: string; targetId: string; amount: number; remainingHp: number }
  | { kind: "statusApplied"; sourceId: string; targetId: string; status: StatusId; duration: number; stacks: number }
  | { kind: "statusTick"; targetId: string; status: StatusId; amount: number; remainingHp: number }
  | { kind: "statusExpired"; targetId: string; status: StatusId }
  | { kind: "control"; sourceId: string; targetId: string; control: string; duration: number }
  | { kind: "move"; sourceId: string; targetId: string; direction: "push" | "pull"; distance: number }
  | { kind: "resource"; targetId: string; resource: string; delta: number }
  | { kind: "buff"; sourceId: string; targetId: string; profileId: string; duration: number; mode: "buff" | "debuff" }
  | { kind: "contestedTest"; sourceId: string; targetId: string; attackerResult: number; defenderResult: number; margin: number; win: boolean }
  | { kind: "saveTest"; targetId: string; roll: number; st: number; failMargin: number; failed: boolean }
  | { kind: "chanceRolled"; sourceId: string; chance: number; passed: boolean }
  | { kind: "pass"; actorId: string; reason: string }
  | { kind: "turnEnd"; round: number; actorId: string }
  | { kind: "combatEnd"; reason: CombatEndReason; winnerId: string | null; rounds: number };

export type CombatLog =
{
  seed: number;
  events: CombatEvent[];
  /** Schema version so persisted logs survive future format changes. */
  schemaVersion: 1;
};

/** Small accumulator so the engine can push events without threading an array. */
export class CombatLogBuilder
{
  private readonly events: CombatEvent[] = [];

  constructor(private readonly seed: number) {}

  push(event: CombatEvent): void
  {
    this.events.push(event);
  }

  build(): CombatLog
  {
    return { seed: this.seed, events: [...this.events], schemaVersion: 1 };
  }
}
