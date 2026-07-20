/**
 * Generate a player-facing description from a `ManeuverDefinition`'s structured
 * data, realising "Opis dla gracza może być generowany automatycznie z danych"
 * from features-to-implement/combat-simulator.md. Output is Polish, matching the
 * rest of the app.
 *
 * Pure domain, deterministic — same definition always yields the same text.
 */

import type { DamageSpec, Effect } from "@/domain/combat-lab/effects/Effect";
import type {
  ManeuverDefinition,
  MechanicalRequirement,
} from "@/domain/combat-lab/effects/ManeuverDefinition";
import {
  damageTypeLabelsPl as damageTypeLabels,
  statusLabelsPl as statusLabels,
  controlVerbsPl as controlLabels,
  resourceLabelsPl as resourceLabels,
  roundsLabelPl,
} from "@/domain/combat-lab/i18n/labels";

const requirementLabels = (requirement: MechanicalRequirement): string =>
{
  switch (requirement.kind)
  {
    case "weapon":
      return `broń: ${requirement.value}`;
    case "shield":
      return "tarcza";
    case "statusOnTarget":
      return `cel pod efektem: ${requirement.value}`;
    case "statusOnSelf":
      return `efekt na sobie: ${requirement.value}`;
    case "minStat":
      return `${requirement.stat} min. ${requirement.value}`;
  }
};

function formatDamageSpec(spec: DamageSpec): string
{
  const hasDice = spec.grade > 0 && spec.amount > 0;
  const bonusSign = spec.bonus > 0 ? `+${spec.bonus}` : spec.bonus < 0 ? `${spec.bonus}` : "";

  if (!hasDice)
  {
    return `${spec.bonus}`;
  }

  const dice = `${spec.amount}k${spec.grade * 2}${spec.isPhantom ? "w" : ""}`;
  return `${dice}${bonusSign}`;
}

const roundsLabel = roundsLabelPl;

function describeEffect(effect: Effect): string
{
  switch (effect.type)
  {
    case "damage":
      return `zadaje ${formatDamageSpec(effect.damage)} obrażeń ${damageTypeLabels[effect.damageType]}`;
    case "heal":
      return `leczy ${formatDamageSpec(effect.amount)} punktów zdrowia`;
    case "status":
    {
      const stacks = effect.stacks && effect.stacks > 1 ? ` (x${effect.stacks})` : "";
      return `nakłada ${statusLabels[effect.status]}${stacks} ${roundsLabel(effect.duration)}`.trim();
    }
    case "buff":
      return `wzmacnia ${roundsLabel(effect.duration)}`.trim();
    case "debuff":
      return `osłabia ${roundsLabel(effect.duration)}`.trim();
    case "push":
      return `odpycha o ${effect.distance}`;
    case "pull":
      return `przyciąga o ${effect.distance}`;
    case "control":
      return `${controlLabels[effect.control]} ${roundsLabel(effect.duration)}`.trim();
    case "resource":
    {
      const verb = effect.delta >= 0 ? "przywraca" : "odbiera";
      return `${verb} ${Math.abs(effect.delta)} ${resourceLabels[effect.resource]}`;
    }
    case "chance":
    {
      const inner = effect.then.map(describeEffect).join(", ");
      return `${effect.chance}% szansy: ${inner}`;
    }
  }
}

/**
 * Render a full description: header (name, cast time, cooldown), requirements,
 * and each effect as a semicolon-separated clause.
 */
export function describeManeuver(definition: ManeuverDefinition): string
{
  const header: string[] = [definition.cost.castTime];
  if (definition.cooldown && definition.cooldown > 0)
  {
    header.push(`odnowienie ${definition.cooldown}`);
  }
  if (definition.cost.mana)
  {
    header.push(`${definition.cost.mana} many`);
  }
  if (definition.cost.essence)
  {
    header.push(`${definition.cost.essence} esencji`);
  }

  const parts: string[] = [`${definition.name} (${header.join(", ")}).`];

  if (definition.hardRequirements.length > 0)
  {
    parts.push(`Wymaga: ${definition.hardRequirements.map(requirementLabels).join(", ")}.`);
  }

  if (definition.effects.length > 0)
  {
    const clauses = definition.effects.map(describeEffect);
    parts.push(`${capitalize(clauses.join("; "))}.`);
  }

  return parts.join(" ");
}

function capitalize(text: string): string
{
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}
