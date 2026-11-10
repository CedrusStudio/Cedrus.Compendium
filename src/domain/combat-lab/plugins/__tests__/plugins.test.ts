import { describe, it, expect, beforeEach } from "vitest";
import { resetRegistry, registerPlugin, getEffectPlugin, getPolicyPlugin, pluginScenarios } from "@/domain/combat-lab/plugins/registry";
import { lifestealPlugin } from "@/domain/combat-lab/plugins/builtin/lifestealPlugin";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import type { Action } from '@/domain/combat-lab/engine/actionEconomy';
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

describe("lifesteal pack extensions", () => {
  beforeEach(() => {
    resetRegistry();
    registerPlugin(lifestealPlugin);
  });

  it.each([
    { data: { amount: 8 }, dealt: 8, healed: 4 },
    { data: { amount: 8, healFraction: 0 }, dealt: 8, healed: 0 },
    { data: { amount: 8, healFraction: 2 }, dealt: 8, healed: 8 },
    { data: { amount: -2, healFraction: 0.5 }, dealt: 0, healed: 0 },
  ])("keeps lifesteal damage, healing and its description consistent for $data", ({ data, dealt, healed }) => {
    const source = createRuntime(makeSnapshot("s", { maxHp: 50 }));
    source.currentHp = 25;
    const target = createRuntime(makeSnapshot("t", { maxHp: 50 }));
    const log = new CombatLogBuilder(1);
    const effect = { type: "custom", effectType: "lifesteal", data } as const;
    applyEffects([effect], source, target, { random: createRng(1).next, log });
    expect(target.currentHp).toBe(50 - dealt);
    expect(source.currentHp).toBe(25 + healed);
    expect(log.build().events.filter(event => event.kind === "heal")).toHaveLength(healed > 0 ? 1 : 0);
    const plugin = getEffectPlugin("lifesteal")!;
    expect(plugin.describe(effect)).toBe(`wysysa ${dealt} zdrowia (leczy ${healed})`);
    expect(plugin.expectedValue?.(effect, source, target)).toBe(dealt + healed);
  });

  it("prefers defensive maneuvers to ordinary attacks and falls back to available actions", () => {
    const policy = getPolicyPlugin("defensive")!.create();
    const source = createRuntime(makeSnapshot("s"));
    const target = createRuntime(makeSnapshot("t"));
    const attack = { kind: "ranged" } as const;
    const pass = { kind: "pass" } as const;
    for (const effect of [
      { type: "heal", amount: { amount: 0, grade: 0, bonus: 2 } },
      { type: "buff", profile: { profileId: "guard" }, duration: 1 },
      { type: "control", control: "stun", duration: 2 },
    ] satisfies Effect[]) {
      const defensive: Action = {
        kind: "maneuver", maneuver: {
          id: "guard", name: "Osłona", grade: 1, description: "", price: 1, tags: [],
          castTime: "Standardowa", cooldown: 1, cost: { castTime: "Standardowa" }, hardRequirements: [], effects: [effect],
        },
      };
      expect(policy.chooseAction(source, target, [pass, attack, defensive])).toBe(defensive);
    }
    expect(policy.chooseAction(source, target, [pass, attack])).toBe(attack);
    expect(policy.chooseAction(source, target, [pass])).toBe(pass);
  });
});
