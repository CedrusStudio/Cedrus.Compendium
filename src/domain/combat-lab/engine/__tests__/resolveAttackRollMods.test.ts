import { describe, it, expect } from "vitest";
import { resolveAttack } from "@/domain/combat-lab/engine/resolveAttack";
import { resolveRangedAttack } from "@/domain/combat-lab/engine/resolveRangedAttack";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { makeSnapshot, makeOffense, makeDefense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

// Attacker with several dice for variance; defender with no reduction so raw === dealt.
const atk = makeSnapshot("A", { offense: makeOffense("o", 3, 4, 0) });
const def = makeSnapshot("B", { defense: makeDefense("d") });
const seed = () => createRng(5).next; // same stream each call → comparable rolls

describe("resolveAttack — roll modifiers (T2b)", () => {
  it("extraDie adds to the raw total on the same seed", () => {
    const plain = resolveAttack(atk, def, seed(), {});
    const extra = resolveAttack(atk, def, seed(), { rollMods: [{ type: "roll", modifier: "extraDie", grade: 3 }] });
    expect(extra.raw).toBeGreaterThan(plain.raw);
  });

  it("advantage never rolls lower than a single roll on the same seed", () => {
    const plain = resolveAttack(atk, def, seed(), {});
    const adv = resolveAttack(atk, def, seed(), { rollMods: [{ type: "roll", modifier: "advantage" }] });
    expect(adv.raw).toBeGreaterThanOrEqual(plain.raw);
  });

  it("disadvantage never rolls higher than a single roll on the same seed", () => {
    const plain = resolveAttack(atk, def, seed(), {});
    const dis = resolveAttack(atk, def, seed(), { rollMods: [{ type: "roll", modifier: "disadvantage" }] });
    expect(dis.raw).toBeLessThanOrEqual(plain.raw);
  });

  it("is deterministic: same seed + same modifier → same result", () => {
    const a = resolveAttack(atk, def, seed(), { rollMods: [{ type: "roll", modifier: "advantage" }] });
    const b = resolveAttack(atk, def, seed(), { rollMods: [{ type: "roll", modifier: "advantage" }] });
    expect(a.raw).toBe(b.raw);
  });
});

describe("resolveRangedAttack — roll modifiers (T2b)", () => {
  // High precision + short distance so the shot always hits; damage roll then
  // gets the modifier.
  const shooter = makeSnapshot("S", { offense: makeOffense("o", 3, 4, 0), precisionValue: 30, attackKind: "rangedPhysical" });
  const target = makeSnapshot("T", { defense: makeDefense("d"), reflexValue: 0 });
  const opts = { distanceST: 3, category: "bezpośrednie" as const };

  it("extraDie adds to the raw damage on a hit (same seed)", () => {
    const plain = resolveRangedAttack(shooter, target, createRng(9).next, opts);
    const extra = resolveRangedAttack(shooter, target, createRng(9).next, { ...opts, rollMods: [{ type: "roll", modifier: "extraDie", grade: 3 }] });
    expect(plain.hit).toBe(true);
    expect(extra.hit).toBe(true);
    expect(extra.raw).toBeGreaterThan(plain.raw);
  });
});
