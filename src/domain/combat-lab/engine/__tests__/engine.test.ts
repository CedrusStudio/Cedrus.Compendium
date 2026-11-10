import { describe, it, expect } from "vitest";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { rollOffense, applyImmunity } from "@/domain/combat-lab/engine/rollOffense";
import { reduceDamage, dealDamage, healDamage } from "@/domain/combat-lab/engine/damage";
import { resolveAttack } from "@/domain/combat-lab/engine/resolveAttack";
import { resolveRangedAttack } from "@/domain/combat-lab/engine/resolveRangedAttack";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { availableActions, recordAction, type Action } from "@/domain/combat-lab/engine/actionEconomy";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { greedyDamagePolicy, valuePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { expectedManeuverValue } from "@/domain/combat-lab/engine/ai/policyValue";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { makeSnapshot, makeOffense, makeDefense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import { createDefaultBuffProfile } from "@/domain/characters/buffs/BuffProfile";

describe("rollOffense()", () => {
  it("is deterministic for a given seed", () => {
    const offense = makeOffense("o", 2, 5, 3);
    const a = rollOffense(offense, createRng(1).next);
    const b = rollOffense(offense, createRng(1).next);
    expect(a).toEqual(b);
  });

  it("sums weapon dice and flat bonus into total", () => {
    const offense = makeOffense("o", 2, 5, 3);
    const result = rollOffense(offense, createRng(42).next);
    // 2 dice of k10 (1..10 each) + 2*2 bonus applied per die inside handleWeaponDamageRolls.
    expect(result.total).toBeGreaterThan(0);
    expect(result.leading).toBe(result.total);
  });
});

describe("damage reduction and pools", () => {
  it("subtracts resistance first, then reduction (rulebook order)", () => {
    const defense = makeDefense("d", { block: 3, protection: 2, resistance: 1 });
    // zwyczajne → full reduction. resistance first: 20 - 1 = 19; then (block+protection) 5 → 14
    expect(reduceDamage(20, defense, "zwyczajne")).toBe(14);
  });

  it("bezpośrednie skips block/parry/dodge (armor + unique only)", () => {
    const defense = makeDefense("d", { block: 8, parry: 4, dodge: 3, protection: 2, bonus: 1 });
    // direct = protection + bonus = 3; 20 - 0 resistance - 3 = 17
    expect(reduceDamage(20, defense, "bezpośrednie")).toBe(17);
  });

  it("blokowane keeps block but skips parry/dodge", () => {
    const defense = makeDefense("d", { block: 8, parry: 4, dodge: 3, protection: 2, bonus: 1 });
    // block mode = block + protection + bonus = 11; 20 - 11 = 9
    expect(reduceDamage(20, defense, "blokowane")).toBe(9);
  });

  it("resistance alone can absorb all damage", () => {
    const defense = makeDefense("d", { resistance: 25 });
    expect(reduceDamage(20, defense, "zwyczajne")).toBe(0);
  });

  it("immunity is NOT a reduction — reduceDamage ignores it", () => {
    const defense = makeDefense("d", { immunity: 100 });
    expect(reduceDamage(20, defense, "zwyczajne")).toBe(20);
  });

  it("nieuchronne ignores defense entirely", () => {
    const defense = makeDefense("d", { block: 100, resistance: 100 });
    expect(reduceDamage(20, defense, "nieuchronne")).toBe(20);
  });

  it("śmiertelne bypasses the barrier pool", () => {
    const runtime = createRuntime(makeSnapshot("x", { maxHp: 30, barrier: 10 }));
    const hp = dealDamage(runtime, 8, true);
    expect(runtime.barrier).toBe(10);
    expect(hp).toBe(22);
  });

  it("consumes barrier before hp", () => {
    const runtime = createRuntime(makeSnapshot("x", { maxHp: 30, barrier: 10 }));
    const hp = dealDamage(runtime, 15);
    expect(runtime.barrier).toBe(0);
    expect(hp).toBe(25);
  });

  it("does not heal above max", () => {
    const runtime = createRuntime(makeSnapshot("x", { maxHp: 30 }));
    runtime.currentHp = 25;
    expect(healDamage(runtime, 100)).toBe(30);
  });
});

describe("applyImmunity() — dice removal", () => {
  it("removes N non-phantom dice, smallest grade first", () => {
    const offense = makeOffense("o", 2, 6, 0); // leading: 2 dice of k12
    offense.damageBonus = { amount: 2, grade: 2, bonus: 0, isPhantom: false }; // 2 dice of k4
    const reduced = applyImmunity(offense, 2);
    // smallest grade (damageBonus k4) removed first
    expect(reduced.damageBonus.amount).toBe(0);
    expect(reduced.leadingWeapon.amount).toBe(2);
  });

  it("spills over to larger dice when needed", () => {
    const offense = makeOffense("o", 2, 6, 0);
    offense.damageBonus = { amount: 1, grade: 2, bonus: 0, isPhantom: false };
    const reduced = applyImmunity(offense, 2);
    expect(reduced.damageBonus.amount).toBe(0); // 1 removed
    expect(reduced.leadingWeapon.amount).toBe(1); // 1 more removed from leading
  });

  it("never removes phantom dice", () => {
    const offense = makeOffense("o", 2, 6, 0);
    offense.leadingWeapon.isPhantom = true;
    const reduced = applyImmunity(offense, 5);
    expect(reduced.leadingWeapon.amount).toBe(2);
  });

  it("immunity 0 returns the offense unchanged", () => {
    const offense = makeOffense("o", 3, 6, 0);
    expect(applyImmunity(offense, 0)).toBe(offense);
  });
});

describe("resolveAttack()", () => {
  it("returns a non-negative dealt amount reduced by defense", () => {
    const attacker = makeSnapshot("a", { offense: makeOffense("a-off", 3, 6, 5) });
    const defender = makeSnapshot("b", { defense: makeDefense("b-def", { block: 4, protection: 2 }) });
    const result = resolveAttack(attacker, defender, createRng(7).next);
    expect(result.dealt).toBeGreaterThanOrEqual(0);
    expect(result.dealt).toBeLessThanOrEqual(result.raw);
    expect(result.reduced).toBe(result.raw - result.dealt);
  });
});

describe("applyEffects()", () => {
  it("applies a damage effect to the target", () => {
    const source = createRuntime(makeSnapshot("s"));
    const target = createRuntime(makeSnapshot("t", { maxHp: 50 }));
    const effects: Effect[] = [
      { type: "damage", damage: { amount: 0, grade: 0, bonus: 10 }, damageType: "nieuchronne" },
    ];
    const log = new CombatLogBuilder(1);
    applyEffects(effects, source, target, { random: createRng(1).next, log });
    expect(target.currentHp).toBe(40);
  });

  it("chance effect fires deterministically per seed", () => {
    const source = createRuntime(makeSnapshot("s"));
    const target = createRuntime(makeSnapshot("t"));
    const effects: Effect[] = [
      { type: "chance", chance: 100, then: [{ type: "status", status: "stagger", duration: 2 }] },
    ];
    const log = new CombatLogBuilder(1);
    applyEffects(effects, source, target, { random: createRng(1).next, log });
    expect(target.statuses.map(s => s.status)).toContain("stagger");
  });

  it("heals the source, not the target", () => {
    const source = createRuntime(makeSnapshot("s", { maxHp: 50 }));
    source.currentHp = 10;
    const target = createRuntime(makeSnapshot("t"));
    const effects: Effect[] = [{ type: "heal", amount: { amount: 0, grade: 0, bonus: 15 } }];
    const log = new CombatLogBuilder(1);
    applyEffects(effects, source, target, { random: createRng(1).next, log });
    expect(source.currentHp).toBe(25);
  });
});

describe("resolveRangedAttack()", () => {
  it("misses when the precyzja test does not beat the ST", async () => {
    const { resolveRangedAttack } = await import("@/domain/combat-lab/engine/resolveRangedAttack");
    const shooter = makeSnapshot("s", { precisionValue: 0, attackKind: "rangedPhysical" });
    const target = makeSnapshot("t", { reflexValue: 100 }); // huge reflex → unhittable
    const result = resolveRangedAttack(shooter, target, createRng(1).next, { distanceST: 5, category: "bezpośrednie" });
    expect(result.hit).toBe(false);
    expect(result.dealt).toBe(0);
    expect(result.st).toBe(100);
  });

  it("hits and deals bezpośrednie damage when precyzja beats the ST", async () => {
    const { resolveRangedAttack } = await import("@/domain/combat-lab/engine/resolveRangedAttack");
    const shooter = makeSnapshot("s", { precisionValue: 50, offense: makeOffense("o", 2, 6, 4), attackKind: "rangedPhysical" });
    const target = makeSnapshot("t", { reflexValue: 1, defense: makeDefense("td", { dodge: 100 }) });
    const result = resolveRangedAttack(shooter, target, createRng(3).next, { distanceST: 3, category: "bezpośrednie" });
    expect(result.hit).toBe(true);
    // bezpośrednie skips dodge entirely, so huge dodge does not matter.
    expect(result.dealt).toBeGreaterThan(0);
  });

  it("uses max(reflex, distance) as the ST", async () => {
    const { resolveRangedAttack: resolve } = await import("@/domain/combat-lab/engine/resolveRangedAttack");
    const shooter = makeSnapshot("s", { precisionValue: 0, attackKind: "rangedPhysical" });
    const target = makeSnapshot("t", { reflexValue: 2 });
    const result = resolve(shooter, target, createRng(1).next, { distanceST: 12, category: "bezpośrednie" });
    expect(result.st).toBe(12);
  });

  it("an attacker precyzja buff turns a miss into a hit", () => {
    const base = createDefaultBuffProfile();
    const precisionBuff = { ...base, id: "pb", attributes: { ...base.attributes, precision: { grade: 0, value: 100, bonus: 0, testBonus: 0 } } };
    const shooter = makeSnapshot("s", { precisionValue: 0, attackKind: "rangedPhysical", offense: makeOffense("so", 1, 3, 0) });
    const target = makeSnapshot("t", { reflexValue: 50, defense: makeDefense("td") });

    const miss = resolveRangedAttack(shooter, target, createRng(1).next, { distanceST: 5, category: "bezpośrednie" });
    const hit = resolveRangedAttack(shooter, target, createRng(1).next, { distanceST: 5, category: "bezpośrednie", attackerBuffs: [precisionBuff] });

    expect(miss.hit).toBe(false);
    expect(hit.hit).toBe(true);
  });

  it("a defender refleks buff raises the to-hit ST", () => {
    const base = createDefaultBuffProfile();
    const reflexBuff = { ...base, id: "rb", attributes: { ...base.attributes, reflex: { grade: 0, value: 20, bonus: 0, testBonus: 0 } } };
    const shooter = makeSnapshot("s", { precisionValue: 0, attackKind: "rangedPhysical" });
    const target = makeSnapshot("t", { reflexValue: 5 });

    const plain = resolveRangedAttack(shooter, target, createRng(1).next, { distanceST: 3, category: "bezpośrednie" });
    const buffed = resolveRangedAttack(shooter, target, createRng(1).next, { distanceST: 3, category: "bezpośrednie", defenderBuffs: [reflexBuff] });

    expect(plain.st).toBe(5);
    expect(buffed.st).toBe(25);
  });
});

describe("action economy — attack independent of maneuvers (fix #2)", () => {
  const standardManeuver = {
    id: "m-std", name: "Cios wirowy", grade: 1, description: "", price: 1, tags: [],
    castTime: "Standardowa" as const, cooldown: 0, cost: { castTime: "Standardowa" as const },
    hardRequirements: [], effects: [{ type: "damage" as const, damage: { amount: 0, grade: 0, bonus: 3 }, damageType: "zwyczajne" as const }],
  };

  it("offers BOTH a basic attack and a standard-action maneuver in the same turn", () => {
    const runtime = createRuntime(makeSnapshot("s", { maneuvers: [standardManeuver] }));
    const actions = availableActions(runtime);
    expect(actions.some(a => a.kind === "attack")).toBe(true);
    expect(actions.some(a => a.kind === "maneuver")).toBe(true);
  });

  it("using the attack does NOT consume the maneuver budget", () => {
    const runtime = createRuntime(makeSnapshot("s", { maneuvers: [standardManeuver] }));
    recordAction(runtime, { kind: "attack" });
    const actions = availableActions(runtime);
    expect(actions.some(a => a.kind === "attack")).toBe(false); // one attack per turn
    expect(actions.some(a => a.kind === "maneuver")).toBe(true); // maneuver still available
  });

  it("re-arms the attack after the turn ends", () => {
    const runtime = createRuntime(makeSnapshot("s"));
    recordAction(runtime, { kind: "attack" });
    expect(availableActions(runtime).some(a => a.kind === "attack")).toBe(false);
    runtime.attackedThisTurn = false; // endTurnLedger does this
    expect(availableActions(runtime).some(a => a.kind === "attack")).toBe(true);
  });

  it("resolves proactive maneuvers BEFORE the attack within a turn", () => {
    const a = makeSnapshot("a", {
      maneuvers: [standardManeuver],
      initiativeValue: 10,
      offense: makeOffense("ao", 1, 3, 0),
    });
    const b = makeSnapshot("b", { maxHp: 500, initiativeValue: 1, offense: makeOffense("bo", 1, 2, 0) });

    const log = runCombat(a, b, { seed: 1, policyA: greedyDamagePolicy, policyB: basicAttackPolicy, maxRounds: 1 });
    const manIdx = log.events.findIndex(e => e.kind === "maneuver" && e.actorId === "a");
    const atkIdx = log.events.findIndex(e => e.kind === "attack" && e.actorId === "a");

    expect(manIdx).toBeGreaterThanOrEqual(0);
    expect(atkIdx).toBeGreaterThan(manIdx);
  });

  it("does not waste an action on a zero-value (empty-effect) maneuver", () => {
    const emptyManeuver = { ...standardManeuver, id: "m-empty", name: "Pusty", effects: [] };
    const a = makeSnapshot("a", { maneuvers: [emptyManeuver], initiativeValue: 10 });
    const b = makeSnapshot("b", { maxHp: 500, initiativeValue: 1 });
    const log = runCombat(a, b, { seed: 1, policyA: greedyDamagePolicy, policyB: basicAttackPolicy, maxRounds: 1 });
    expect(log.events.some(e => e.kind === "maneuver" && e.actorId === "a")).toBe(false);
  });
});

describe("buff application (self-buff raises the attack — model (a))", () => {
  function damageBonusBuff(id: string, bonus: number) {
    const profile = createDefaultBuffProfile();
    return { ...profile, id, offense: { ...profile.offense, damageBonus: { ...profile.offense.damageBonus, bonus } } };
  }

  it("attacker buffs raise the offense of the very next attack", () => {
    const attacker = makeSnapshot("a", { offense: makeOffense("a", 1, 3, 0) });
    const defender = makeSnapshot("b", { defense: makeDefense("b") });

    const noBuff = resolveAttack(attacker, defender, createRng(5).next);
    const withBuff = resolveAttack(attacker, defender, createRng(5).next, { attackerBuffs: [damageBonusBuff("buff", 50)] });

    expect(withBuff.dealt).toBe(noBuff.dealt + 50);
  });

  it("a buff effect activates a profile from the caster's library onto the recipient", () => {
    const source = createRuntime(makeSnapshot("s", { buffProfiles: [damageBonusBuff("p", 10)] }));
    const target = createRuntime(makeSnapshot("t"));
    const effects: Effect[] = [{ type: "buff", profile: { profileId: "p" }, duration: 2 }];

    applyEffects(effects, source, target, { random: createRng(1).next, log: new CombatLogBuilder(1) });

    // self-buff → lands on the source; duration tracked
    expect(source.activeBuffs.map(b => b.profile.id)).toContain("p");
    expect(source.activeBuffs[0]!.remaining).toBe(2);
    expect(target.activeBuffs).toHaveLength(0);
  });

  it("ignores a buff effect whose profileId is not in the library", () => {
    const source = createRuntime(makeSnapshot("s", { buffProfiles: [] }));
    const target = createRuntime(makeSnapshot("t"));
    const effects: Effect[] = [{ type: "buff", profile: { profileId: "missing" }, duration: 2 }];
    applyEffects(effects, source, target, { random: createRng(1).next, log: new CombatLogBuilder(1) });
    expect(source.activeBuffs).toHaveLength(0);
  });
});

describe("valuePolicy — credits buffs / control / heal", () => {
  const maneuverBase = {
    id: "m", name: "M", grade: 1, description: "", price: 1, tags: [],
    castTime: "Standardowa" as const, cooldown: 0, cost: { castTime: "Standardowa" as const }, hardRequirements: [],
  };
  function defenseBuff(id: string, block: number) {
    const p = createDefaultBuffProfile();
    return { ...p, id, defense: { ...p.defense, block } };
  }

  it("chooses a control maneuver over passing", () => {
    const self = createRuntime(makeSnapshot("s"));
    const opponent = createRuntime(makeSnapshot("o", { offense: makeOffense("oo", 2, 6, 4) }));
    const stun = { ...maneuverBase, effects: [{ type: "control" as const, control: "stun" as const, duration: 2 }] };
    const chosen = valuePolicy.chooseAction(self, opponent, [{ kind: "pass" }, { kind: "maneuver", maneuver: stun }]);
    expect(chosen.kind).toBe("maneuver");
  });

  it("values a heal only up to missing hp", () => {
    const self = createRuntime(makeSnapshot("s", { maxHp: 50 }));
    self.currentHp = 45; // missing 5
    const opponent = createRuntime(makeSnapshot("o"));
    const value = expectedManeuverValue(self, opponent, [{ type: "heal", amount: { amount: 0, grade: 0, bonus: 100 } }]);
    expect(value).toBe(5);
  });

  it("credits a defensive self-buff (greedy would score it 0)", () => {
    const self = createRuntime(makeSnapshot("s", { buffProfiles: [defenseBuff("db", 6)] }));
    const opponent = createRuntime(makeSnapshot("o", { offense: makeOffense("oo", 2, 6, 4) }));
    const value = expectedManeuverValue(self, opponent, [{ type: "buff", profile: { profileId: "db" }, duration: 2 }]);
    expect(value).toBeGreaterThan(0);
  });

  it("makes a defensive-buff reaction fire (unlike the damage-only greedy)", () => {
    const reactive = {
      ...maneuverBase, id: "r", name: "Zasłona", castTime: "Natychmiastowa" as const, cooldown: 1,
      cost: { castTime: "Natychmiastowa" as const },
      effects: [{ type: "buff" as const, profile: { profileId: "db" }, duration: 2 }],
    };
    const attacker = makeSnapshot("atk", { initiativeValue: 10, offense: makeOffense("ao", 2, 6, 4), maxHp: 100 });
    const defender = makeSnapshot("def", { initiativeValue: 1, maneuvers: [reactive], buffProfiles: [defenseBuff("db", 6)], maxHp: 100, offense: makeOffense("do", 1, 2, 0) });

    const withValue = runCombat(attacker, defender, { seed: 1, policyA: basicAttackPolicy, policyB: valuePolicy, maxRounds: 1 });
    const withGreedy = runCombat(attacker, defender, { seed: 1, policyA: basicAttackPolicy, policyB: greedyDamagePolicy, maxRounds: 1 });

    expect(withValue.events.some(e => e.kind === "reaction" && e.actorId === "def")).toBe(true);
    expect(withGreedy.events.some(e => e.kind === "reaction" && e.actorId === "def")).toBe(false);
  });
});

describe("reaction hook — instant maneuvers respond to attacks", () => {
  const riposte = {
    id: "m-riposte", name: "Riposta", grade: 1, description: "", price: 1, tags: [],
    castTime: "Natychmiastowa" as const, cooldown: 1, cost: { castTime: "Natychmiastowa" as const },
    hardRequirements: [],
    effects: [{ type: "damage" as const, damage: { amount: 0, grade: 0, bonus: 8 }, damageType: "nieuchronne" as const }],
  };

  it("defender uses a reactive maneuver before the attack lands", () => {
    const attacker = makeSnapshot("atk", { initiativeValue: 10, offense: makeOffense("ao", 1, 2, 0), maxHp: 100 });
    const defender = makeSnapshot("def", { initiativeValue: 1, maneuvers: [riposte], maxHp: 100, offense: makeOffense("do", 1, 2, 0) });

    const log = runCombat(attacker, defender, { seed: 1, policyA: greedyDamagePolicy, policyB: greedyDamagePolicy, maxRounds: 1 });

    const reactionIdx = log.events.findIndex(e => e.kind === "reaction" && e.actorId === "def");
    const attackIdx = log.events.findIndex(e => e.kind === "attack" && e.actorId === "atk");

    expect(reactionIdx).toBeGreaterThanOrEqual(0);
    // reaction resolves BEFORE the attacker's attack
    expect(reactionIdx).toBeLessThan(attackIdx);
    // the riposte damaged the attacker
    expect(log.events.some(e => e.kind === "damage" && e.targetId === "atk")).toBe(true);
  });

  it("reactive maneuvers are NOT used proactively on one's own turn", () => {
    // A combatant whose only maneuver is reactive should never emit a "maneuver"
    // event (only possibly a "reaction").
    const a = makeSnapshot("a", { initiativeValue: 10, maneuvers: [riposte], offense: makeOffense("ao", 2, 6, 4) });
    const b = makeSnapshot("b", { initiativeValue: 1, maxHp: 30, offense: makeOffense("bo", 1, 2, 0) });
    const log = runCombat(a, b, { seed: 2, policyA: greedyDamagePolicy, policyB: basicAttackPolicy, maxRounds: 3 });
    expect(log.events.some(e => e.kind === "maneuver" && e.actorId === "a")).toBe(false);
  });
});

describe("stagger (oszołomienie)", () => {
  it("blocks maneuvers while staggered", async () => {
    const { availableActions } = await import("@/domain/combat-lab/engine/actionEconomy");
    const maneuver = {
      id: "m", name: "Cios", grade: 1, description: "", price: 1, tags: [],
      castTime: "Standardowa" as const, cooldown: 0, cost: { castTime: "Standardowa" as const },
      hardRequirements: [], effects: [],
    };
    const runtime = createRuntime(makeSnapshot("s", { maneuvers: [maneuver] }));
    expect(availableActions(runtime).some(a => a.kind === "maneuver")).toBe(true);

    runtime.statuses.push({ status: "stagger", remaining: 2, stacks: 1 });
    const actions = availableActions(runtime);
    expect(actions.some(a => a.kind === "maneuver")).toBe(false);
    expect(actions.some(a => a.kind === "attack")).toBe(true);
  });

  it("halves guards for a staggered defender", () => {
    const attacker = makeSnapshot("a", { offense: makeOffense("a", 3, 6, 5) });
    const defender = makeSnapshot("b", { defense: makeDefense("b", { block: 8, parry: 4, dodge: 2 }) });
    const normal = resolveAttack(attacker, defender, createRng(11).next);
    const staggered = resolveAttack(attacker, defender, createRng(11).next, { defenderStaggered: true });
    // Same seed → same raw roll; halved guards mean equal or MORE damage gets through.
    expect(staggered.dealt).toBeGreaterThanOrEqual(normal.dealt);
  });
});

describe("runCombat()", () => {
  it("produces an identical log for the same inputs (determinism)", () => {
    const a = makeSnapshot("knight", { offense: makeOffense("k", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
    const b = makeSnapshot("orc", { offense: makeOffense("o", 2, 5, 3), maxHp: 40, initiativeValue: 1 });

    const log1 = runCombat(a, b, { seed: 2026, policyA: greedyDamagePolicy, policyB: basicAttackPolicy });
    const log2 = runCombat(a, b, { seed: 2026, policyA: greedyDamagePolicy, policyB: basicAttackPolicy });

    expect(log1).toEqual(log2);
  });

  it("different seeds can produce different fights", () => {
    const a = makeSnapshot("a", { maxHp: 30 });
    const b = makeSnapshot("b", { maxHp: 30 });
    const log1 = runCombat(a, b, { seed: 1 });
    const log2 = runCombat(a, b, { seed: 999 });
    expect(log1.events).not.toEqual(log2.events);
  });

  it("terminates with a winner when one side out-damages the other", () => {
    const strong = makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 60, initiativeValue: 5 });
    const weak = makeSnapshot("weak", { offense: makeOffense("w", 1, 2, 0), maxHp: 20 });

    const log = runCombat(strong, weak, { seed: 3, maxRounds: 100 });
    const end = log.events.find(e => e.kind === "combatEnd");
    expect(end).toBeDefined();
    if (end && end.kind === "combatEnd") {
      expect(end.reason).toBe("knockout");
      expect(end.winnerId).toBe("strong");
    }
  });

  it("respects the round cap and ends as timeout when nobody can kill", () => {
    // Both deal 0 damage (immune), so the fight must hit the cap.
    const a = makeSnapshot("a", { defense: makeDefense("ad", { immunity: 100 }), maxHp: 30 });
    const b = makeSnapshot("b", { defense: makeDefense("bd", { immunity: 100 }), maxHp: 30 });

    const log = runCombat(a, b, { seed: 1, maxRounds: 10 });
    const end = log.events.find(e => e.kind === "combatEnd");
    if (end && end.kind === "combatEnd") {
      expect(end.reason).toBe("timeout");
      expect(end.rounds).toBe(10);
    }
  });

  it("bleeding status ticks damage over rounds", () => {
    const bleedManeuver = {
      id: "m-bleed",
      name: "Rozcięcie",
      grade: 1,
      description: "",
      price: 1,
      tags: [],
      castTime: "Standardowa" as const,
      cooldown: 0,
      cost: { castTime: "Standardowa" as const },
      hardRequirements: [],
      effects: [
        {
          type: "status" as const,
          status: "bleeding" as const,
          duration: 3,
          tick: { damage: { amount: 0, grade: 0, bonus: 5 }, damageType: "bezpośrednie" as const },
        },
      ],
    };
    const bleeder = makeSnapshot("bleeder", { maneuvers: [bleedManeuver], initiativeValue: 5, offense: makeOffense("bo", 1, 2, 0) });
    const victim = makeSnapshot("victim", { maxHp: 100, offense: makeOffense("vo", 1, 2, 0) });

    const log = runCombat(bleeder, victim, { seed: 5, policyA: greedyDamagePolicy, maxRounds: 20 });
    const ticks = log.events.filter(e => e.kind === "statusTick");
    expect(ticks.length).toBeGreaterThan(0);
  });
});

describe("turn flow under ranged attacks and disabling effects", () => {
  it.each([
    { attackKind: "rangedPhysical", precisionValue: 12, hit: true, dealt: 10, remainingHp: 30 },
    { attackKind: "rangedMagic", precisionValue: 12, hit: true, dealt: 6, remainingHp: 34 },
    { attackKind: "rangedPhysical", precisionValue: -20, hit: false, dealt: 0, remainingHp: 40 },
    { attackKind: "rangedMagic", precisionValue: -20, hit: false, dealt: 0, remainingHp: 40 },
  ] as const)("logs $attackKind hit=$hit and uses its defense category", ({ attackKind, precisionValue, hit, dealt, remainingHp }) => {
    const projectile = makeOffense("projectile", 0, 0);
    projectile.damageBonus.bonus = 12;
    const archer = makeSnapshot("archer", { attackKind, precisionValue, initiativeValue: 50, offense: projectile });
    const guard = makeSnapshot("guard", { defense: makeDefense("guard-defense", { block: 4, parry: 8, dodge: 6, protection: 2 }) });
    const log = runCombat(archer, guard, { seed: 2, maxRounds: 1, distanceST: 7 });
    expect(log.events.find(event => event.kind === "rangedAttack")).toMatchObject({
      actorId: "archer", targetId: "guard", hit, dealt, remainingHp,
    });
  });

  function openingManeuver(effects: Effect[])
  {
    return {
      id: "opening", name: "Otwarcie", grade: 1, description: "", price: 1, tags: [],
      castTime: "Standardowa" as const, cooldown: 4, cost: { castTime: "Standardowa" as const }, hardRequirements: [], effects,
    };
  }

  const attackAfterOpening = {
    name: "opening then attack",
    chooseAction: (_self: unknown, _other: unknown, available: Action[]) =>
      available.find(action => action.kind === "maneuver") ?? available[0],
  };

  it("records a controlled turn and restores action after the stun expires", () => {
    const attacker = makeSnapshot("A", {
      initiativeValue: 40, offense: makeOffense("weak", 0, 0, 0),
      maneuvers: [openingManeuver([{ type: "control", control: "stun", duration: 2 }])],
    });
    const guard = makeSnapshot("B", { offense: makeOffense("weak", 0, 0, 0) });
    const events = runCombat(attacker, guard, { seed: 2, maxRounds: 2, policyA: attackAfterOpening }).events;
    expect(events.filter(event => event.kind === "pass")).toContainEqual({ kind: "pass", actorId: "B", reason: "controlled" });
    expect(events.filter(event => event.kind === "attack" && event.actorId === "B")).toHaveLength(1);
  });

  it("does not grant the target an action while in the lethal health buffer", () => {
    const strike = makeOffense("strike", 0, 0);
    strike.damageBonus.bonus = 5;
    const attacker = makeSnapshot("A", { initiativeValue: 40, offense: strike });
    const guard = makeSnapshot("B", { maxHp: 4, lethalHealth: 20, lethalRounds: 3 });
    const events = runCombat(attacker, guard, { seed: 2, maxRounds: 1 }).events;
    expect(events).toContainEqual({ kind: "pass", actorId: "B", reason: "downed" });
    expect(events.some(event => event.kind === "attack" && event.actorId === "B")).toBe(false);
    expect(events.at(-1)).toMatchObject({ kind: "combatEnd", reason: "timeout", winnerId: "A" });
  });

  it("stops after a finishing maneuver instead of rolling the later weapon attack", () => {
    const attacker = makeSnapshot("A", {
      initiativeValue: 40, maneuvers: [openingManeuver([
        { type: "damage", damageType: "śmiertelne", damage: { amount: 0, grade: 0, bonus: 8 } },
      ])],
    });
    const guard = makeSnapshot("B", { maxHp: 5, barrier: 20 });
    const events = runCombat(attacker, guard, { seed: 2, maxRounds: 3, policyA: attackAfterOpening }).events;
    expect(events).toContainEqual({
      kind: "damage", sourceId: "A", targetId: "B", damageType: "śmiertelne", amount: 8, remainingHp: -3,
    });
    expect(events.some(event => event.kind === "attack")).toBe(false);
    expect(events.at(-1)).toMatchObject({ kind: "combatEnd", reason: "knockout", winnerId: "A", rounds: 1 });
  });
});
