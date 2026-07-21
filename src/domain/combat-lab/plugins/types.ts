/**
 * Plugin extension-point contracts (domain / worker-safe parts). See
 * features-to-implement/combat-lab-plugin-system-plan.md.
 *
 * These cover the pieces that run inside the deterministic engine (effects,
 * policies) and pure data (scenarios). UI analyzers live in the application-layer
 * registry, since they carry React components and must not reach the worker.
 */

import type { z } from "zod";
import type { CustomEffect } from "@/domain/combat-lab/effects/Effect";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import type { EffectContext } from "@/domain/combat-lab/engine/applyEffect";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import type { Scenario } from "@/domain/combat-lab/scenario/scenario";

/**
 * A plugin-provided effect. Behaviour is keyed by `effectType`; the engine looks
 * it up when it interprets a `CustomEffect`. Must be deterministic (randomness
 * only via `ctx.random`) and its `data` must be structured-clonable (it crosses
 * the worker boundary).
 */
export type EffectPlugin =
{
  effectType: string;
  /** Optional Zod schema validating the `data` payload. */
  schema?: z.ZodType<unknown>;
  /** Apply the effect to combat state (mutates runtime + appends to the log). */
  apply(effect: CustomEffect, source: CombatantRuntime, target: CombatantRuntime, ctx: EffectContext): void;
  /** Player-facing (Polish) description for `describeManeuver`. */
  describe(effect: CustomEffect): string;
  /** Heuristic value for `valuePolicy` (expected-damage units). Default 0. */
  expectedValue?(effect: CustomEffect, self: CombatantRuntime, opponent: CombatantRuntime): number;
};

/** A plugin-provided action policy, resolved by name (functions can't cross the worker boundary). */
export type PolicyPlugin =
{
  name: string;
  label: string;
  create(config?: unknown): ActionPolicy;
};

/** A declarative bundle of worker-safe extensions. */
export type CombatLabPlugin =
{
  id: string;
  name: string;
  version: string;
  effects?: EffectPlugin[];
  policies?: PolicyPlugin[];
  scenarios?: Scenario[];
};
