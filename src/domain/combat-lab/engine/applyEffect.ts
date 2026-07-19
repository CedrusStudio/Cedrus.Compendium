/**
 * Interpreter for `Effect[]`: the bridge between the data-driven maneuver model
 * and the mutable combat state. Applies each effect to the appropriate target,
 * mutating runtime state and appending to the log. Deterministic (injected rng).
 *
 * Targeting convention: `target` receives offensive effects (damage, status,
 * control, push/pull, debuff); `source` receives self effects (heal, buff,
 * resource gains). Resource drains (negative delta) hit the target.
 *
 * Scope note (Etap 1): damage / heal / status / control / chance are fully
 * modelled. `buff` / `debuff` are LOGGED but do not yet mutate stats — applying
 * a BuffProfile mid-fight requires re-deriving the snapshot and is deferred to a
 * later pass (see plan). push / pull / resource are logged (no positional or
 * resource-pool model until Scenario Builder, v0.4).
 */

import type { Effect } from "@/domain/combat-lab/effects/Effect";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import type { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";
import type { DamageResolutionConfig } from "@/domain/combat-lab/engine/damage";
import { defaultDamageResolution, reduceDamage, dealDamage, healDamage } from "@/domain/combat-lab/engine/damage";
import { rollDamageSpec } from "@/domain/combat-lab/engine/rollOffense";
import { selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";

export type EffectContext =
{
  random: RandomSource;
  log: CombatLogBuilder;
  config?: DamageResolutionConfig;
};

export function applyEffects(
  effects: Effect[],
  source: CombatantRuntime,
  target: CombatantRuntime,
  ctx: EffectContext,
): void
{
  for (const effect of effects)
  {
    applyEffect(effect, source, target, ctx);
  }
}

function applyEffect(
  effect: Effect,
  source: CombatantRuntime,
  target: CombatantRuntime,
  ctx: EffectContext,
): void
{
  const config = ctx.config ?? defaultDamageResolution;

  switch (effect.type)
  {
    case "damage":
    {
      const raw = rollDamageSpec(effect.damage, ctx.random);
      const ignoresDefense = effect.damageType === "true";
      const dealt = reduceDamage(raw, selectDefaultDefense(target.snapshot), config, ignoresDefense);
      const remainingHp = dealDamage(target, dealt);
      ctx.log.push({
        kind: "damage",
        sourceId: source.snapshot.id,
        targetId: target.snapshot.id,
        amount: dealt,
        damageType: effect.damageType,
        remainingHp,
      });
      break;
    }

    case "heal":
    {
      const amount = rollDamageSpec(effect.amount, ctx.random);
      const remainingHp = healDamage(source, amount);
      ctx.log.push({
        kind: "heal",
        sourceId: source.snapshot.id,
        targetId: source.snapshot.id,
        amount,
        remainingHp,
      });
      break;
    }

    case "status":
    {
      const stacks = effect.stacks ?? 1;
      const existing = target.statuses.find(s => s.status === effect.status);
      if (existing)
      {
        existing.remaining = Math.max(existing.remaining, effect.duration);
        existing.stacks += stacks;
        if (effect.tick) existing.tick = effect.tick;
      }
      else
      {
        target.statuses.push({ status: effect.status, remaining: effect.duration, stacks, tick: effect.tick });
      }
      ctx.log.push({
        kind: "statusApplied",
        sourceId: source.snapshot.id,
        targetId: target.snapshot.id,
        status: effect.status,
        duration: effect.duration,
        stacks,
      });
      break;
    }

    case "control":
    {
      const existing = target.controls.find(c => c.control === effect.control);
      if (existing) existing.remaining = Math.max(existing.remaining, effect.duration);
      else target.controls.push({ control: effect.control, remaining: effect.duration });
      ctx.log.push({
        kind: "control",
        sourceId: source.snapshot.id,
        targetId: target.snapshot.id,
        control: effect.control,
        duration: effect.duration,
      });
      break;
    }

    case "push":
    case "pull":
    {
      ctx.log.push({
        kind: "move",
        sourceId: source.snapshot.id,
        targetId: target.snapshot.id,
        direction: effect.type,
        distance: effect.distance,
      });
      break;
    }

    case "resource":
    {
      const recipient = effect.delta >= 0 ? source : target;
      ctx.log.push({
        kind: "resource",
        targetId: recipient.snapshot.id,
        resource: effect.resource,
        delta: effect.delta,
      });
      break;
    }

    case "buff":
    case "debuff":
    {
      const recipient = effect.type === "buff" ? source : target;
      ctx.log.push({
        kind: "buff",
        sourceId: source.snapshot.id,
        targetId: recipient.snapshot.id,
        profileId: effect.profile.profileId,
        duration: effect.duration,
        mode: effect.type,
      });
      break;
    }

    case "chance":
    {
      const passed = ctx.random() * 100 < effect.chance;
      ctx.log.push({ kind: "chanceRolled", sourceId: source.snapshot.id, chance: effect.chance, passed });
      if (passed)
      {
        applyEffects(effect.then, source, target, ctx);
      }
      break;
    }
  }
}
