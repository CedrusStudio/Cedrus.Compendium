import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { effectAuthoringSchema, effectsAuthoringSchema } from "../effectAuthoringSchema";
import { effectSchema } from "../effectSchema";
import { registerPlugin, resetRegistry } from "@/domain/combat-lab/plugins/registry";

const push = { type: "push", distance: 2 };
const pool = { pool: [{ anyOf: [{ group: "attributes", key: "reflex" }] }] };

afterEach(resetRegistry);

describe("effect write validation", () =>
{
  it.each([
    [{ ...push, typo: 1 }, ["typo"]],
    [{ type: "when", condition: { kind: "onCritical", typo: 1 }, then: [push] }, ["condition", "typo"]],
    [{ type: "when", condition: { kind: "onCritical" }, then: [{ ...push, typo: 1 }] }, ["then", 0, "typo"]],
    [{ type: "chance", chance: 50, then: [{ ...push, typo: 1 }] }, ["then", 0, "typo"]],
    [{ type: "scale", source: { kind: "selfDice" }, effect: { ...push, typo: 1 } }, ["effect", "typo"]],
    [{ type: "contested", attacker: pool, defender: pool, onWin: [{ ...push, typo: 1 }] }, ["onWin", 0, "typo"]],
    [{ type: "contested", attacker: pool, defender: pool, onWin: [], perMargin: { per: 1, effect: { ...push, typo: 1 } } }, ["perMargin", "effect", "typo"]],
    [{ type: "save", pool, st: 7, onFail: [{ ...push, typo: 1 }] }, ["onFail", 0, "typo"]],
    [{ type: "save", pool, st: 7, onFail: [], perMarginOfFailure: { per: 1, effect: { ...push, typo: 1 } } }, ["perMarginOfFailure", "effect", "typo"]],
    [{ type: "damage", damageType: "zwyczajne", damage: { amount: 1, grade: 0, bonus: 0, typo: 1 } }, ["damage", "typo"]],
    [{ type: "custom", effectType: "lifesteal", data: { amount: 2, typo: 1 } }, ["data", "typo"]],
  ])("rejects a silently dropped field with its full path: %j", (effect, path) =>
  {
    expect(effectSchema.safeParse(effect).success).toBe(true);
    const parsed = effectsAuthoringSchema.safeParse([effect]);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues).toContainEqual(expect.objectContaining({ path: [0, ...path] }));
  });

  it.each([
    { type: "resource", resource: "mana", delta: 1 },
    { type: "when", condition: { kind: "hasResource", resource: "mana", min: 1 }, then: [push] },
    { type: "scale", source: { kind: "selfResource", resource: "mana" }, effect: push },
  ])("keeps the legacy read alias while rejecting it on writes: %j", effect =>
  {
    expect(effectSchema.safeParse(effect).success).toBe(true);
    expect(effectAuthoringSchema.safeParse(effect).success).toBe(false);
  });

  it("accepts built-ins without startup registry initialization and validates their payload", () =>
  {
    const custom = { type: "custom", effectType: "lifesteal", data: { amount: 3, healFraction: 0.25 } };
    expect(effectAuthoringSchema.parse(custom)).toEqual(custom);
    expect(effectAuthoringSchema.safeParse({ ...custom, data: { amount: -1 } }).success).toBe(false);
    expect(effectAuthoringSchema.safeParse({ ...custom, data: null }).success).toBe(false);
    expect(effectAuthoringSchema.safeParse({ ...custom, effectType: "missing" }).success).toBe(false);
  });

  it("blocks plugins without a schema", () =>
  {
    registerPlugin({ id: "test", name: "Test", version: "1", effects: [{ effectType: "unsafe", apply() {}, describe: () => "" }] });
    expect(effectAuthoringSchema.safeParse({ type: "custom", effectType: "unsafe", data: {} }).success).toBe(false);
  });

  it("validates nested plugin keys and returns parsed defaults/transforms without mutating input", () =>
  {
    registerPlugin({ id: "test", name: "Test", version: "1", effects: [{
      effectType: "normalized", apply() {}, describe: () => "",
      schema: z.object({ config: z.object({ name: z.string().trim(), amount: z.number().default(2) }) }),
    }] });
    const custom = { type: "custom", effectType: "normalized", data: { config: { name: "  sample  " } } };
    const input = { type: "scale", source: { kind: "selfDice" }, effect: custom };
    expect(effectAuthoringSchema.parse(input)).toEqual({ ...input, effect: { ...custom, data: { config: { name: "sample", amount: 2 } } } });
    expect(custom.data).toEqual({ config: { name: "  sample  " } });
    expect(effectAuthoringSchema.safeParse({ ...custom, data: { config: { name: "sample", typo: 1 } } }).success).toBe(false);
  });
});
