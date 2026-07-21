/**
 * Reference plugin — proves every worker-safe extension point:
 *   - effect "lifesteal": deals inevitable damage and heals the attacker,
 *   - policy "defensive": prefers heal/buff/control maneuvers over attacking,
 *   - scenario "duel": a tight close-quarters duel.
 * Doubles as living documentation of the plugin API.
 */

import { z } from "zod";
import type { CombatLabPlugin } from "@/domain/combat-lab/plugins/types";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { dealDamage, healDamage } from "@/domain/combat-lab/engine/damage";
import { NO_OVERRIDES } from "@/domain/combat-lab/tuning/parameters";

const lifestealSchema = z.object({ amount: z.number().min(0), healFraction: z.number().min(0).max(1).optional() });

function amountOf(data: Record<string, unknown>): number
{
  return Math.max(0, Math.round(Number(data.amount) || 0));
}

function fractionOf(data: Record<string, unknown>): number
{
  const f = Number(data.healFraction);
  return Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0.5;
}

const defensivePolicy: ActionPolicy = {
  name: "defensive",
  chooseAction(_self, _opponent, available)
  {
    const defensive = available.find(a => a.kind === "maneuver" && a.maneuver.effects.some(e => e.type === "heal" || e.type === "buff" || e.type === "control"));
    if (defensive) return defensive;
    return available.find(a => a.kind === "attack" || a.kind === "ranged") ?? available[0]!;
  },
};

export const lifestealPlugin: CombatLabPlugin = {
  id: "cedrus.lifesteal-pack",
  name: "Lifesteal Pack",
  version: "1.0.0",
  effects: [
    {
      effectType: "lifesteal",
      schema: lifestealSchema,
      apply(effect, source, target, ctx)
      {
        const amount = amountOf(effect.data);
        const remainingHp = dealDamage(target, amount);
        ctx.log.push({ kind: "damage", sourceId: source.snapshot.id, targetId: target.snapshot.id, amount, damageType: "nieuchronne", remainingHp });

        const heal = Math.round(amount * fractionOf(effect.data));
        if (heal > 0)
        {
          const srcHp = healDamage(source, heal);
          ctx.log.push({ kind: "heal", sourceId: source.snapshot.id, targetId: source.snapshot.id, amount: heal, remainingHp: srcHp });
        }
      },
      describe(effect)
      {
        const amount = amountOf(effect.data);
        return `wysysa ${amount} zdrowia (leczy ${Math.round(amount * fractionOf(effect.data))})`;
      },
      expectedValue(effect)
      {
        const amount = amountOf(effect.data);
        return amount + amount * fractionOf(effect.data);
      },
    },
  ],
  policies: [
    { name: "defensive", label: "Defensywna (plugin)", create: () => defensivePolicy },
  ],
  scenarios: [
    { id: "duel", name: "Pojedynek", description: "Zwarcie na krótki dystans, obaj z ograniczonym unikiem.", distanceST: 3, maxRounds: 120, aOverrides: { ...NO_OVERRIDES, dodge: -2 }, bOverrides: { ...NO_OVERRIDES, dodge: -2 }, aHpMultiplier: 1, bHpMultiplier: 1 },
  ],
};
