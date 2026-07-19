/**
 * Reduce a full `CombatLog` to a compact `RawResult`. This is where the durable
 * log becomes analysable data (winner, length, cause of death, maneuver usage).
 */

import type { CombatLog, CombatEvent } from "@/domain/combat-lab/engine/CombatLog";
import type { RawResult, DeathCause } from "@/domain/combat-lab/simulation/RawResult";

export function summarizeCombat(log: CombatLog): RawResult
{
  const end = log.events.find(e => e.kind === "combatEnd");
  const start = log.events.find(e => e.kind === "combatStart");

  const winnerId = end && end.kind === "combatEnd" ? end.winnerId : null;
  const reason = end && end.kind === "combatEnd" ? end.reason : "draw";
  const rounds = end && end.kind === "combatEnd" ? end.rounds : 0;

  const loserId = resolveLoserId(start, winnerId);

  return {
    seed: log.seed,
    winnerId,
    reason,
    rounds,
    winnerRemainingHp: winnerId ? remainingHpFor(log.events, winnerId, start) : null,
    deathCause: loserId ? deathCauseFor(log.events, loserId) : "none",
    maneuverUsage: countManeuvers(log.events),
    schemaVersion: 1,
  };
}

function resolveLoserId(start: CombatEvent | undefined, winnerId: string | null): string | null
{
  if (!start || start.kind !== "combatStart" || !winnerId) return null;
  const other = start.combatants.find(c => c.id !== winnerId);
  return other ? other.id : null;
}

/** The last `remainingHp` recorded for a combatant, else its starting maxHp. */
function remainingHpFor(events: CombatEvent[], id: string, start: CombatEvent | undefined): number
{
  for (let i = events.length - 1; i >= 0; i--)
  {
    const event = events[i]!;
    if ((event.kind === "attack" || event.kind === "damage" || event.kind === "statusTick") && event.targetId === id)
    {
      return event.remainingHp;
    }
    if (event.kind === "heal" && event.targetId === id)
    {
      return event.remainingHp;
    }
  }

  if (start && start.kind === "combatStart")
  {
    const combatant = start.combatants.find(c => c.id === id);
    if (combatant) return combatant.maxHp;
  }
  return 0;
}

/** Classify what last damaged the loser into a `DeathCause`. */
function deathCauseFor(events: CombatEvent[], loserId: string): DeathCause
{
  for (let i = events.length - 1; i >= 0; i--)
  {
    const event = events[i]!;
    if (event.kind === "attack" && event.targetId === loserId) return "weapon";
    if (event.kind === "damage" && event.targetId === loserId) return "ability";
    if (event.kind === "statusTick" && event.targetId === loserId) return event.status;
  }
  return "none";
}

function countManeuvers(events: CombatEvent[]): Record<string, number>
{
  const usage: Record<string, number> = {};
  for (const event of events)
  {
    if (event.kind === "maneuver")
    {
      usage[event.maneuverName] = (usage[event.maneuverName] ?? 0) + 1;
    }
  }
  return usage;
}
