import { describe, it, expect } from "vitest";
import { EFFECT_TYPE_ORDER, EFFECT_TYPE_META, defaultEffect } from "@/application/combat-lab/effects-editor/effectFieldsMeta";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";

// Defaults that are complete on their own (no user-supplied required string).
const SELF_VALID = ["damage", "heal", "stat", "roll", "status", "control", "push", "pull", "resource", "contested", "save", "when", "chance"] as const;

describe("defaultEffect()", () => {
  it.each(SELF_VALID)("produces a schema-valid default for '%s'", (type) => {
    const r = effectSchema.safeParse(defaultEffect(type));
    expect(r.success).toBe(true);
  });

  it("every default carries the right discriminant", () => {
    for (const type of EFFECT_TYPE_ORDER) expect(defaultEffect(type).type).toBe(type);
  });

  it("buff/debuff/custom validate once the required id/type is filled", () => {
    expect(effectSchema.safeParse({ ...defaultEffect("buff"), profile: { profileId: "p1" } }).success).toBe(true);
    expect(effectSchema.safeParse({ ...defaultEffect("debuff"), profile: { profileId: "p1" } }).success).toBe(true);
    expect(effectSchema.safeParse({ ...defaultEffect("custom"), effectType: "lifesteal" }).success).toBe(true);
  });
});

describe("EFFECT_TYPE_META", () => {
  it("has metadata for every ordered type and no duplicates", () => {
    expect(new Set(EFFECT_TYPE_ORDER).size).toBe(EFFECT_TYPE_ORDER.length);
    for (const type of EFFECT_TYPE_ORDER) expect(EFFECT_TYPE_META[type]).toBeDefined();
  });

  it("simple types declare a non-empty field list", () => {
    for (const type of EFFECT_TYPE_ORDER)
    {
      const meta = EFFECT_TYPE_META[type]!;
      if (meta.simple) expect((meta.fields ?? []).length).toBeGreaterThan(0);
    }
  });
});
