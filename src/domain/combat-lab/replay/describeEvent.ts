/**
 * Human (Polish) one-line label for a single `CombatEvent`, used by the replay
 * scrubber. Pure and deterministic. Names are resolved via a lookup passed in
 * (combatant id → display name) so the domain stays free of UI concerns.
 */

import type { CombatEvent } from "@/domain/combat-lab/engine/CombatLog";

export type NameLookup = (id: string) => string;

export function describeEvent(event: CombatEvent, nameOf: NameLookup): string
{
  switch (event.kind)
  {
    case "combatStart":
      return `Początek walki: ${event.combatants.map(c => nameOf(c.id)).join(" vs ")}`;
    case "initiative":
      return `Inicjatywa: ${event.order.map(o => `${nameOf(o.id)} (${o.roll})`).join(", ")}`;
    case "roundStart":
      return `— Runda ${event.round} —`;
    case "turnStart":
      return `Tura: ${nameOf(event.actorId)}`;
    case "attack":
      return `${nameOf(event.actorId)} atakuje ${nameOf(event.targetId)}: ${event.dealt} obr.${event.critical ? " (traf. kryt.)" : ""} → ${event.remainingHp} HP`;
    case "maneuver":
      return `${nameOf(event.actorId)} używa: ${event.maneuverName}`;
    case "damage":
      return `${nameOf(event.targetId)} otrzymuje ${event.amount} obr. (${event.damageType}) → ${event.remainingHp} HP`;
    case "heal":
      return `${nameOf(event.targetId)} leczy ${event.amount} → ${event.remainingHp} HP`;
    case "statusApplied":
      return `${nameOf(event.targetId)}: ${event.status} (${event.duration} rund, x${event.stacks})`;
    case "statusTick":
      return `${nameOf(event.targetId)}: ${event.status} zadaje ${event.amount} → ${event.remainingHp} HP`;
    case "statusExpired":
      return `${nameOf(event.targetId)}: ${event.status} wygasa`;
    case "control":
      return `${nameOf(event.targetId)}: ${event.control} (${event.duration} rund)`;
    case "move":
      return `${nameOf(event.targetId)}: ${event.direction === "push" ? "odepchnięty" : "przyciągnięty"} o ${event.distance}`;
    case "resource":
      return `${nameOf(event.targetId)}: ${event.resource} ${event.delta >= 0 ? "+" : ""}${event.delta}`;
    case "buff":
      return `${nameOf(event.targetId)}: ${event.mode === "buff" ? "wzmocnienie" : "osłabienie"} (${event.duration} rund)`;
    case "chanceRolled":
      return `Rzut na szansę ${event.chance}%: ${event.passed ? "sukces" : "porażka"}`;
    case "pass":
      return `${nameOf(event.actorId)} pomija turę (${event.reason})`;
    case "turnEnd":
      return `Koniec tury: ${nameOf(event.actorId)}`;
    case "combatEnd":
      return event.winnerId
        ? `Koniec walki: zwycięża ${nameOf(event.winnerId)} (${event.reason}, ${event.rounds} rund)`
        : `Koniec walki: remis (${event.reason}, ${event.rounds} rund)`;
  }
}
