import { describe, it, expect } from "vitest";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { SnapshotSpell } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { availableSpells, recordAction, tickSpellCooldowns } from "@/domain/combat-lab/engine/actionEconomy";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";

function spell(over: Partial<SnapshotSpell> = {}): SnapshotSpell
{
  return {
    id: "fire",
    name: "Ognisty pocisk",
    offense: makeOffense("fire-off", 3, 6, 5),
    costEssence: 20,
    castTime: "Standardowa",
    cooldown: 2,
    ...over,
  };
}

describe("spell action economy", () =>
{
  it("offers a spell only when essence covers the cost", () =>
  {
    const snap = { ...makeSnapshot("caster"), spells: [spell({ cooldown: 0 })], startingResources: { essence: 20 } };
    const rt = createRuntime(snap);
    expect(availableSpells(rt)).toHaveLength(1);

    recordAction(rt, { kind: "spell", spell: spell({ cooldown: 0 }) });
    expect(rt.resources.essence).toBe(0);
    expect(rt.attackedThisTurn).toBe(true);

    rt.attackedThisTurn = false; // new turn, but no essence left
    expect(availableSpells(rt)).toHaveLength(0);
  });

  it("respects the per-spell cooldown", () =>
  {
    const s = spell({ costEssence: 0, cooldown: 2 });
    const snap = { ...makeSnapshot("caster"), spells: [s], startingResources: { essence: 0 } };
    const rt = createRuntime(snap);
    expect(availableSpells(rt)).toHaveLength(1);

    recordAction(rt, { kind: "spell", spell: s });
    rt.attackedThisTurn = false;
    expect(availableSpells(rt)).toHaveLength(0); // cooldown 2

    tickSpellCooldowns(rt); // → 1
    expect(availableSpells(rt)).toHaveLength(0);
    tickSpellCooldowns(rt); // → 0
    expect(availableSpells(rt)).toHaveLength(1);
  });

  it("a greedy caster prefers a strong spell over the basic attack", () =>
  {
    const caster = { ...makeSnapshot("caster", { maxHp: 50 }), spells: [spell({ cooldown: 0 })], startingResources: { essence: 100 } };
    const dummy = makeSnapshot("dummy", { maxHp: 40 });
    const log = runCombat(caster, dummy, { seed: 7, policyA: greedyDamagePolicy, policyB: basicAttackPolicy });

    const casts = log.events.filter(e => e.kind === "spellCast");
    expect(casts.length).toBeGreaterThan(0);
  });
});
