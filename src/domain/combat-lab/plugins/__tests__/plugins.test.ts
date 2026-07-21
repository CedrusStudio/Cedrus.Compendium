import { describe, it, expect, beforeEach } from "vitest";
import { resetRegistry, registerPlugin, getEffectPlugin, getPolicyPlugin, pluginScenarios } from "@/domain/combat-lab/plugins/registry";
import { lifestealPlugin } from "@/domain/combat-lab/plugins/builtin/lifestealPlugin";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

describe("plugin registry", () => {
  beforeEach(() => resetRegistry());

  it("registers effects, policies and scenarios from a plugin", () => {
    registerPlugin(lifestealPlugin);
    expect(getEffectPlugin("lifesteal")).toBeDefined();
    expect(getPolicyPlugin("defensive")).toBeDefined();
    expect(pluginScenarios().some(s => s.id === "duel")).toBe(true);
  });

  it("throws on a duplicate plugin id", () => {
    registerPlugin(lifestealPlugin);
    expect(() => registerPlugin(lifestealPlugin)).toThrow();
  });
});

describe("plugin effect via applyEffects", () => {
  beforeEach(() => resetRegistry());

  it("lifesteal damages the target and heals the source", () => {
    registerPlugin(lifestealPlugin);
    const source = createRuntime(makeSnapshot("s", { maxHp: 50 }));
    source.currentHp = 20;
    const target = createRuntime(makeSnapshot("t", { maxHp: 50 }));

    const effects: Effect[] = [{ type: "custom", effectType: "lifesteal", data: { amount: 10, healFraction: 0.5 } }];
    applyEffects(effects, source, target, { random: createRng(1).next, log: new CombatLogBuilder(1) });

    expect(target.currentHp).toBe(40);
    expect(source.currentHp).toBe(25); // +5 heal
  });

  it("is deterministic (same inputs → same state)", () => {
    registerPlugin(lifestealPlugin);
    const run = () => {
      const s = createRuntime(makeSnapshot("s", { maxHp: 50 }));
      const t = createRuntime(makeSnapshot("t", { maxHp: 50 }));
      applyEffects([{ type: "custom", effectType: "lifesteal", data: { amount: 7, healFraction: 0.3 } }], s, t, { random: createRng(2).next, log: new CombatLogBuilder(2) });
      return [s.currentHp, t.currentHp];
    };
    expect(run()).toEqual(run());
  });

  it("an unknown custom effect is a safe no-op when its plugin is not loaded", () => {
    const source = createRuntime(makeSnapshot("s"));
    const target = createRuntime(makeSnapshot("t", { maxHp: 50 }));
    applyEffects([{ type: "custom", effectType: "not-loaded", data: {} }], source, target, { random: createRng(1).next, log: new CombatLogBuilder(1) });
    expect(target.currentHp).toBe(50);
  });
});
