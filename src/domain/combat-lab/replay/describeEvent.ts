/**
 * Human (Polish) one-line label for a single `CombatEvent`, used by the replay
 * scrubber. Pure and deterministic. Names are resolved via a lookup passed in
 * (combatant id → display name) so the domain stays free of UI concerns.
 */

import type { CombatEvent } from "@/domain/combat-lab/engine/CombatLog";
import {
  statusLabelsPl,
  damageTypeLabelsPl,
  controlNounsPl,
  resourceLabelsPl,
} from "@/domain/combat-lab/i18n/labels";
import type { ControlKind } from "@/domain/combat-lab/effects/Effect";

export type NameLookup = (id: string) => string;

const controlLabel = (control: string): string =>
  controlNounsPl[control as ControlKind] ?? control;

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
    {
      const parts: string[] = [];
      if (event.immunityDice > 0) parts.push(`niewrażliwość −${event.immunityDice}k`);
      if (event.resistance > 0) parts.push(`odporność −${event.resistance}`);
      if (event.reduction > 0) parts.push(`redukcja −${event.reduction}`);
      const how = parts.length > 0 ? ` (${parts.join(", ")})` : "";
      return `${nameOf(event.actorId)} atakuje ${nameOf(event.targetId)}: wyrzucono ${event.raw}${event.critical ? " (traf. kryt.)" : ""}, zredukowano ${event.reduced}${how} → zadano ${event.dealt} → ${event.remainingHp} HP`;
    }
    case "rangedAttack":
      return event.hit
        ? `${nameOf(event.actorId)} strzela do ${nameOf(event.targetId)}: trafienie (${event.attackRoll} vs ST ${event.st}), wyrzucono ${event.raw}${event.critical ? " (traf. kryt.)" : ""}, zredukowano ${event.reduced} → zadano ${event.dealt} → ${event.remainingHp} HP`
        : `${nameOf(event.actorId)} strzela do ${nameOf(event.targetId)}: pudło (${event.attackRoll} vs ST ${event.st})`;
    case "spellCast":
      return event.hit
        ? `${nameOf(event.actorId)} rzuca „${event.spellName}" na ${nameOf(event.targetId)}: trafienie (${event.attackRoll} vs ST ${event.st}), wyrzucono ${event.raw}${event.critical ? " (traf. kryt.)" : ""}, zredukowano ${event.reduced} → zadano ${event.dealt} → ${event.remainingHp} HP (esencja: ${event.remainingEssence})`
        : `${nameOf(event.actorId)} rzuca „${event.spellName}" na ${nameOf(event.targetId)}: pudło (${event.attackRoll} vs ST ${event.st}) (esencja: ${event.remainingEssence})`;
    case "multiplier":
    {
      const what = event.multiplierTarget === "damageDealt" ? "zadawane obrażenia" : "otrzymywane obrażenia";
      return `${nameOf(event.targetId)}: ${what} ×${event.factor} (${event.duration} r.)`;
    }
    case "stanceRank":
      return `${nameOf(event.actorId)}: ranga ${event.target === "state" ? "stanu" : "postawy"} ${event.delta >= 0 ? "+" : ""}${event.delta} (${event.duration} r.)`;
    case "stanceChange":
    {
      const when = event.timing === "beforeAttack" ? "przed atakiem" : "po ataku";
      const from = event.from ? `z „${event.from}" ` : "";
      return `${nameOf(event.actorId)} zmienia postawę ${from}na „${event.to}" (ranga ${event.grade}, ${when})`;
    }
    case "maneuver":
      return `${nameOf(event.actorId)} używa: ${event.maneuverName}`;
    case "reaction":
      return `${nameOf(event.actorId)} reaguje manewrem: ${event.maneuverName}`;
    case "damage":
      return `${nameOf(event.targetId)} otrzymuje ${event.amount} obr. ${damageTypeLabelsPl[event.damageType]} → ${event.remainingHp} HP`;
    case "heal":
      return `${nameOf(event.targetId)} leczy ${event.amount} → ${event.remainingHp} HP`;
    case "statusApplied":
      return `${nameOf(event.targetId)}: ${statusLabelsPl[event.status]} (${event.duration} rund, x${event.stacks})`;
    case "statusTick":
      return `${nameOf(event.targetId)}: ${statusLabelsPl[event.status]} zadaje ${event.amount} → ${event.remainingHp} HP`;
    case "statusExpired":
      return `${nameOf(event.targetId)}: ${statusLabelsPl[event.status]} wygasa`;
    case "control":
      return `${nameOf(event.targetId)}: ${controlLabel(event.control)} (${event.duration} rund)`;
    case "move":
      return `${nameOf(event.targetId)}: ${event.direction === "push" ? "odepchnięty" : "przyciągnięty"} o ${event.distance}`;
    case "resource":
      return `${nameOf(event.targetId)}: ${resourceLabelsPl[event.resource as keyof typeof resourceLabelsPl] ?? event.resource} ${event.delta >= 0 ? "+" : ""}${event.delta}`;
    case "buff":
      return `${nameOf(event.targetId)}: ${event.mode === "buff" ? "wzmocnienie" : "osłabienie"} (${event.duration} rund)`;
    case "contestedTest":
      return `Test sporny ${nameOf(event.sourceId)} vs ${nameOf(event.targetId)}: ${event.attackerResult} vs ${event.defenderResult} (margines ${event.margin >= 0 ? "+" : ""}${event.margin}) → ${event.win ? "wygrana" : "przegrana"}`;
    case "saveTest":
      return `Test ${nameOf(event.targetId)} o ST ${event.st}: wynik ${event.roll} → ${event.failed ? `porażka (o ${event.failMargin})` : "sukces"}`;
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
