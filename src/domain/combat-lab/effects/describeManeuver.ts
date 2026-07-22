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
import { getEffectPlugin } from "@/domain/combat-lab/plugins/registry";
import { statEffectDeltas } from "@/domain/combat-lab/effects/statBuff";

import type { TestSide, EffectCondition, ScaleSource } from "@/domain/combat-lab/effects/Effect";

function describeScaleSource(s: ScaleSource): string
{
  switch (s.kind)
  {
    case "opponentDice": return "kość przeciwnika";
    case "opponentImmunity": return "niewrażliwość wroga";
    case "selfResource": return s.resource === "mana" ? "manę" : "esencję";
    case "selfStatusStacks": return `stack: ${statusLabels[s.status]}`;
    case "targetStatusStacks": return `stack celu: ${statusLabels[s.status]}`;
  }
}

const ATTACK_KIND_PL: Record<string, string> = { melee: "walce wręcz", rangedPhysical: "atakom dystansowym", rangedMagic: "magii dystansowej" };

function describeCondition(c: EffectCondition): string
{
  switch (c.kind)
  {
    case "opponentAttackKind": return `tylko przeciw ${ATTACK_KIND_PL[c.value] ?? c.value}`;
    case "targetHasStatus": return `gdy cel ma ${statusLabels[c.status]}`;
    case "selfHasStatus": return `gdy masz ${statusLabels[c.status]}`;
    case "onCritical": return "przy trafieniu krytycznym";
    case "onDamageDealt": return "gdy zadano obrażenia";
    case "selfAirborne": return "atakując z powietrza";
    case "opponentCharging": return "tylko przeciw szarży";
    case "hasResource": return `gdy masz ≥${c.min} ${c.resource === "mana" ? "many" : "esencji"}`;
  }
}

const SKILL_PL: Record<string, string> = {
  fencing: "fechtunek", artifice: "fortel", precision: "precyzja", initiative: "inicjatywa",
  martialArt: "walka wręcz", horsemanship: "jeździectwo", fortitude: "wytrwałość", reflex: "refleks", willpower: "wola",
  strength: "siła", dexterity: "zręczność", constitution: "budowa", mind: "umysł", charisma: "charyzma", spellborn: "czarokrwistość",
};

function describePool(side: TestSide): string
{
  const terms = side.pool.map(t => t.anyOf.map(r => SKILL_PL[r.key] ?? r.key).join("/")).join(" + ");
  const mod = side.modifier ? (side.modifier > 0 ? `+${side.modifier}` : `${side.modifier}`) : "";
  const extra = [
    side.rollMod === "advantage" ? "przewaga" : side.rollMod === "disadvantage" ? "utrudnienie" : "",
    side.dieGradeDelta ? `kość ${side.dieGradeDelta > 0 ? "+" : ""}${side.dieGradeDelta}` : "",
  ].filter(Boolean).join(", ");
  return `${terms}${mod}${extra ? ` [${extra}]` : ""}`;
}

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
    case "stat":
    {
      const deltas = statEffectDeltas(effect)
        .map(([label, value]) => `${label} ${value > 0 ? "+" : ""}${value}`)
        .join(", ");
      const verb = effect.mode === "self" ? "sobie" : "celowi";
      const body = deltas.length > 0 ? `: ${deltas}` : "";
      return `zmienia ${verb}${body} ${roundsLabel(effect.duration)}`.trim();
    }
    case "contested":
    {
      const onWin = effect.onWin.map(describeEffect).join(", ");
      const scaling = effect.perMargin
        ? `; za każde ${effect.perMargin.per > 1 ? `${effect.perMargin.per} oczek` : "oczko"} przewagi: ${describeEffect(effect.perMargin.effect)}${effect.perMargin.cap !== undefined ? ` (maks. ${effect.perMargin.cap}×)` : ""}`
        : "";
      const who = effect.onWinTarget === "self" ? " (na siebie)" : "";
      return `test sporny ${describePool(effect.attacker)} vs ${describePool(effect.defender)} → przy wygranej${who}: ${onWin}${scaling}`;
    }
    case "save":
    {
      const onFail = effect.onFail.map(describeEffect).join(", ");
      const scaling = effect.perMarginOfFailure
        ? `; za każde oczko porażki: ${describeEffect(effect.perMarginOfFailure.effect)}${effect.perMarginOfFailure.cap !== undefined ? ` (maks. ${effect.perMarginOfFailure.cap}×)` : ""}`
        : "";
      const who = effect.who === "self" ? "atakujący" : "cel";
      return `test ${describePool(effect.pool)} (${who}) o ST ${effect.st} → przy porażce: ${onFail}${scaling}`;
    }
    case "roll":
      if (effect.modifier === "advantage") return "przewaga na rzut ataku (2 rzuty, wyższy)";
      if (effect.modifier === "disadvantage") return "utrudnienie rzutu ataku (2 rzuty, niższy)";
      return `dodatkowa kość obrażeń k${(effect.grade ?? 3) * 2}`;
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
    case "when":
    {
      const inner = effect.then.map(describeEffect).join(", ");
      return `${describeCondition(effect.condition)}: ${inner}`;
    }
    case "scale":
    {
      const per = effect.per && effect.per > 1 ? `${effect.per} ` : "";
      const cap = effect.cap !== undefined ? ` (maks. ${effect.cap}×)` : "";
      return `za każde ${per}${describeScaleSource(effect.source)}: ${describeEffect(effect.effect)}${cap}`;
    }
    case "chance":
    {
      const inner = effect.then.map(describeEffect).join(", ");
      return `${effect.chance}% szansy: ${inner}`;
    }
    case "custom":
      return getEffectPlugin(effect.effectType)?.describe(effect) ?? `efekt „${effect.effectType}"`;
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
