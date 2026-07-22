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

import type { Effect, EffectCondition } from "@/domain/combat-lab/effects/Effect";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import type { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";
import { reduceDamage, dealDamage, healDamage, bypassesBarrier, halveGuards } from "@/domain/combat-lab/engine/damage";
import { rollDamageSpec } from "@/domain/combat-lab/engine/rollOffense";
import { selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { isStaggered, activeBuffProfiles } from "@/domain/combat-lab/engine/CombatState";
import { effectiveDefense } from "@/domain/combat-lab/engine/buffs";
import { statEffectToProfile } from "@/domain/combat-lab/effects/statBuff";
import { resolveContestedTest, resolveSaveTest } from "@/domain/combat-lab/engine/resolveContestedTest";
import { countScaleSource, scaleTimes } from "@/domain/combat-lab/engine/scaleSource";
import { getEffectPlugin } from "@/domain/combat-lab/plugins/registry";

export type EffectContext =
{
  random: RandomSource;
  log: CombatLogBuilder;
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

/**
 * Evaluate a `WhenEffect` condition against the current runtime state.
 * Deterministic; unknown/unsupported conditions default to false (safe skip).
 */
export function evaluateCondition(condition: EffectCondition, source: CombatantRuntime, target: CombatantRuntime): boolean
{
  switch (condition.kind)
  {
    case "opponentAttackKind":
      return target.snapshot.attackKind === condition.value;
    case "targetHasStatus":
      return target.statuses.some(s => s.status === condition.status);
    case "selfHasStatus":
      return source.statuses.some(s => s.status === condition.status);
    case "onCritical":
      return source.lastAttack?.critical === true;
    case "onDamageDealt":
      return (source.lastAttack?.dealt ?? 0) > 0;
    case "selfAirborne":
      return source.snapshot.positional?.airborne === true;
    case "opponentCharging":
      return target.snapshot.positional?.charging === true;
    case "hasResource":
      return source.resources[condition.resource] >= condition.min;
    default:
      return false;
  }
}

function applyEffect(
  effect: Effect,
  source: CombatantRuntime,
  target: CombatantRuntime,
  ctx: EffectContext,
): void
{
  switch (effect.type)
  {
    case "damage":
    {
      const raw = rollDamageSpec(effect.damage, ctx.random);
      const rawDefense = selectDefaultDefense(target.snapshot);
      const buffedDefense = rawDefense ? effectiveDefense(rawDefense, activeBuffProfiles(target)) : undefined;
      const defense = buffedDefense && isStaggered(target) ? halveGuards(buffedDefense) : buffedDefense;
      const dealt = reduceDamage(raw, defense, effect.damageType);
      const remainingHp = dealDamage(target, dealt, bypassesBarrier(effect.damageType));
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
      // Track mana/essence pools; "action" has no pool (logged only).
      if (effect.resource === "mana" || effect.resource === "essence")
      {
        recipient.resources[effect.resource] = Math.max(0, recipient.resources[effect.resource] + effect.delta);
      }
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
      // The profile is defined in the acting combatant's buff-profile library
      // and applied to the recipient's runtime (raises/lowers offense/defense
      // at resolve time). This is what lets a self-buff maneuver boost the
      // attack that follows it this turn.
      const profile = source.snapshot.buffProfiles.find(p => p.id === effect.profile.profileId);
      if (profile)
      {
        const existing = recipient.activeBuffs.find(b => b.profile.id === profile.id);
        if (existing) existing.remaining = Math.max(existing.remaining, effect.duration);
        else recipient.activeBuffs.push({ profile, remaining: effect.duration });
      }
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

    case "stat":
    {
      // Build a throwaway BuffProfile from the inline deltas and apply it as an
      // ActiveBuff — same runtime path as a profile-based buff, so it affects
      // the recipient's effective offense/defense (defensive maneuvers work).
      const recipient = effect.mode === "self" ? source : target;
      const profile = statEffectToProfile(effect);
      const existing = recipient.activeBuffs.find(b => b.profile.id === profile.id);
      if (existing) existing.remaining = Math.max(existing.remaining, effect.duration);
      else recipient.activeBuffs.push({ profile, remaining: effect.duration });
      ctx.log.push({
        kind: "buff",
        sourceId: source.snapshot.id,
        targetId: recipient.snapshot.id,
        profileId: profile.id,
        duration: effect.duration,
        mode: effect.mode === "self" ? "buff" : "debuff",
      });
      break;
    }

    case "roll":
    {
      // Queue a roll modifier on the caster; the next attack this turn consumes
      // it (see runCombat). Transient — not duration-based.
      source.rollMods.push(effect);
      ctx.log.push({
        kind: "buff",
        sourceId: source.snapshot.id,
        targetId: source.snapshot.id,
        profileId: `roll:${effect.modifier}`,
        duration: 0,
        mode: "buff",
      });
      break;
    }

    case "contested":
    {
      const res = resolveContestedTest(source.snapshot.skills, target.snapshot.skills, effect, ctx.random);
      ctx.log.push({
        kind: "contestedTest",
        sourceId: source.snapshot.id,
        targetId: target.snapshot.id,
        attackerResult: res.attackerResult,
        defenderResult: res.defenderResult,
        margin: res.margin,
        win: res.win,
      });
      if (res.win)
      {
        // onWin effects hit the opponent by default, or the caster ("self" —
        // defensive tests like Akrobatyka that self-buff on a win).
        const recipient = effect.onWinTarget === "self" ? source : target;
        applyEffects(effect.onWin, source, recipient, ctx);
        if (effect.perMargin)
        {
          const per = Math.max(1, effect.perMargin.per);
          let times = Math.floor(res.margin / per);
          if (effect.perMargin.cap !== undefined) times = Math.min(times, effect.perMargin.cap);
          for (let i = 0; i < times; i++) applyEffects([effect.perMargin.effect], source, recipient, ctx);
        }
      }
      break;
    }

    case "save":
    {
      // The saver (target by default) rolls its pool vs a fixed ST. On failure,
      // onFail effects hit the saver, scaled by the margin of failure.
      const saver = effect.who === "self" ? source : target;
      const res = resolveSaveTest(saver.snapshot.skills, effect, ctx.random);
      ctx.log.push({ kind: "saveTest", targetId: saver.snapshot.id, roll: res.roll, st: res.st, failMargin: res.failMargin, failed: res.failed });
      if (res.failed)
      {
        applyEffects(effect.onFail, source, saver, ctx);
        if (effect.perMarginOfFailure)
        {
          const per = Math.max(1, effect.perMarginOfFailure.per);
          let times = Math.floor(res.failMargin / per);
          if (effect.perMarginOfFailure.cap !== undefined) times = Math.min(times, effect.perMarginOfFailure.cap);
          for (let i = 0; i < times; i++) applyEffects([effect.perMarginOfFailure.effect], source, saver, ctx);
        }
      }
      break;
    }

    case "when":
    {
      if (evaluateCondition(effect.condition, source, target))
      {
        applyEffects(effect.then, source, target, ctx);
      }
      break;
    }

    case "scale":
    {
      const count = countScaleSource(effect.source, source, target);
      const times = scaleTimes(count, effect.per, effect.cap);
      for (let i = 0; i < times; i++) applyEffects([effect.effect], source, target, ctx);
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

    case "custom":
    {
      // Plugin-provided effect: behaviour comes from the registry. Unknown types
      // are a safe no-op (the plugin simply isn't loaded in this context).
      getEffectPlugin(effect.effectType)?.apply(effect, source, target, ctx);
      break;
    }
  }
}
