/**
 * Static plugin registry for worker-safe extensions (effects, policies,
 * scenarios). One registry instance per JS context (main thread AND each Web
 * Worker) — `loadPlugins()` populates it identically in every context so the
 * engine behaves the same wherever it runs.
 *
 * Collisions on id / effectType / policy name throw at registration — plugins
 * must not silently shadow each other (plan, Otwarte pytania #5).
 */

import type { CombatLabPlugin, EffectPlugin, PolicyPlugin } from "@/domain/combat-lab/plugins/types";
import type { Scenario } from "@/domain/combat-lab/scenario/scenario";

const effects = new Map<string, EffectPlugin>();
const policies = new Map<string, PolicyPlugin>();
const scenarios: Scenario[] = [];
const registeredPluginIds = new Set<string>();

export function registerPlugin(plugin: CombatLabPlugin): void
{
  if (registeredPluginIds.has(plugin.id))
  {
    throw new Error(`Plugin already registered: ${plugin.id}`);
  }

  for (const effect of plugin.effects ?? [])
  {
    if (effects.has(effect.effectType)) throw new Error(`Duplicate effect type from plugin ${plugin.id}: ${effect.effectType}`);
    effects.set(effect.effectType, effect);
  }
  for (const policy of plugin.policies ?? [])
  {
    if (policies.has(policy.name)) throw new Error(`Duplicate policy name from plugin ${plugin.id}: ${policy.name}`);
    policies.set(policy.name, policy);
  }
  for (const scenario of plugin.scenarios ?? [])
  {
    if (scenarios.some(s => s.id === scenario.id)) throw new Error(`Duplicate scenario id from plugin ${plugin.id}: ${scenario.id}`);
    scenarios.push(scenario);
  }

  registeredPluginIds.add(plugin.id);
}

export function getEffectPlugin(effectType: string): EffectPlugin | undefined
{
  return effects.get(effectType);
}

export function getPolicyPlugin(name: string): PolicyPlugin | undefined
{
  return policies.get(name);
}

export function pluginPolicies(): PolicyPlugin[]
{
  return [...policies.values()];
}

export function pluginScenarios(): Scenario[]
{
  return [...scenarios];
}

export function isPluginRegistered(id: string): boolean
{
  return registeredPluginIds.has(id);
}

/** Test-only: wipe the registry. */
export function resetRegistry(): void
{
  effects.clear();
  policies.clear();
  scenarios.length = 0;
  registeredPluginIds.clear();
}
