import { describe, it, expect } from "vitest";
import { computeSynergy } from "@/domain/combat-lab/analysis/synergy";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";

const damageManeuver = (id: string, bonus: number): ManeuverDefinition => ({
  id, name: id, grade: 1, description: "", price: 1, tags: [],
  castTime: "Standardowa", cooldown: 0, cost: { castTime: "Standardowa" }, hardRequirements: [],
  effects: [{ type: "damage", damage: { amount: 0, grade: 0, bonus }, damageType: "nieuchronne" }],
});

describe("computeSynergy()", () => {
  it("gives a strong damage maneuver a positive contribution", () => {
    const subject = makeSnapshot("subject", {
      offense: makeOffense("so", 1, 3, 0),
      maneuvers: [damageManeuver("burst", 20)],
      initiativeValue: 5,
      maxHp: 40,
    });
    const opponent = makeSnapshot("opponent", { offense: makeOffense("oo", 1, 3, 0), maxHp: 40 });

    const report = computeSynergy(subject, opponent, { count: 200, subjectPolicy: greedyDamagePolicy, opponentPolicy: basicAttackPolicy });

    expect(report.elements).toHaveLength(1);
    expect(report.elements[0]!.id).toBe("burst");
    expect(report.elements[0]!.contribution).toBeGreaterThan(0);
    expect(report.baselineWinRate).toBeGreaterThan(report.elements[0]!.withoutWinRate);
  });

  it("ablacja obejmuje postawę — obronna postawa ma dodatni wkład", () => {
    const subject = makeSnapshot("subject", {
      offense: makeOffense("so", 1, 3, 0),
      initiativeValue: 5,
      maxHp: 40,
    });
    const withStance = {
      ...subject,
      stance: { name: "Mur Tarcz", baseGrade: 1, variantsByGrade: { 1: [{ type: "stat" as const, mode: "self" as const, duration: 1, protection: 8 }] } },
    };
    const opponent = makeSnapshot("opponent", { offense: makeOffense("oo", 1, 3, 0), maxHp: 40 });

    const report = computeSynergy(withStance, opponent, { count: 120, subjectPolicy: greedyDamagePolicy, opponentPolicy: basicAttackPolicy });

    const stance = report.elements.find(e => e.id === "stance:Mur Tarcz");
    expect(stance).toBeDefined();
    expect(stance!.contribution).toBeGreaterThan(0);
  });

  it("ranks a bigger maneuver above a smaller one", () => {
    const subject = makeSnapshot("s", {
      offense: makeOffense("so", 1, 3, 0),
      maneuvers: [damageManeuver("big", 25), damageManeuver("small", 3)],
      initiativeValue: 5, maxHp: 45,
    });
    const opponent = makeSnapshot("o", { offense: makeOffense("oo", 1, 3, 0), maxHp: 45 });

    const report = computeSynergy(subject, opponent, { count: 150, subjectPolicy: greedyDamagePolicy, opponentPolicy: basicAttackPolicy });
    expect(report.elements[0]!.id).toBe("big");
  });

  it("reports progress for baseline + each maneuver", () => {
    const subject = makeSnapshot("s", { maneuvers: [damageManeuver("a", 5), damageManeuver("b", 5)] });
    const opponent = makeSnapshot("o");
    const seen: number[] = [];
    computeSynergy(subject, opponent, { count: 20 }, (done, total) => { seen.push(done); expect(total).toBe(3); });
    expect(seen).toEqual([1, 2, 3]);
  });

  it("ablates spells too and credits a strong spell", () => {
    const subject = {
      ...makeSnapshot("caster", { offense: makeOffense("so", 1, 3, 0), initiativeValue: 5, maxHp: 45 }),
      spells: [{ id: "fb", name: "Fireball", offense: makeOffense("fb-off", 4, 8, 12), costEssence: 0, castTime: "Standardowa" as const, cooldown: 0 }],
      startingResources: { essence: 1000 },
    };
    const opponent = makeSnapshot("o", { offense: makeOffense("oo", 1, 3, 0), maxHp: 45 });

    const report = computeSynergy(subject, opponent, { count: 150, subjectPolicy: greedyDamagePolicy, opponentPolicy: basicAttackPolicy });
    const fireball = report.elements.find(e => e.id === "fb");
    expect(fireball).toBeDefined();
    expect(fireball!.contribution).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const build = () => makeSnapshot("s", { maneuvers: [damageManeuver("a", 10)], initiativeValue: 3 });
    const opp = () => makeSnapshot("o");
    const a = computeSynergy(build(), opp(), { count: 100, subjectPolicy: greedyDamagePolicy });
    const b = computeSynergy(build(), opp(), { count: 100, subjectPolicy: greedyDamagePolicy });
    expect(a).toEqual(b);
  });
});
