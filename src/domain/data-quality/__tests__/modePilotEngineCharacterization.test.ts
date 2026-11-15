import { expect, it } from "vitest";
import { preparePilotReview } from "../pilotReview";
import { pilotReviewSourceRecords } from "@/__tests__/fixtures/pilotReview";
import { effectsAuthoringSchema } from "@/domain/combat-lab/effects/effectAuthoringSchema";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { activeBuffProfiles, createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { effectiveDefense, effectiveOffense } from "@/domain/combat-lab/engine/buffs";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { basicAttackPolicy, type ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { CombatantSnapshot, SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";

// These tests document observed engine behavior, including unresolved rulebook
// differences. Passing them does not approve the proposed mappings for application.
const batch = preparePilotReview(pilotReviewSourceRecords(), { exportCreatedAt: "2026-11-15T18:38:23.881Z", sourceRevision: "a".repeat(40) });
function mode(collection: "Stance" | "State", grade: number): SnapshotMode
{
  const row = batch.rows.find(row => row.collection === collection && row.identityAssertions.grade === grade)!;
  return { name: row.identityAssertions.name, baseGrade: grade, variantsByGrade: { [grade]: effectsAuthoringSchema.parse(row.proposed.effects) } };
}

type Frame = { resistance: number; damage: number; buffs: number; stance: string | undefined };
function fight(options: { stance?: SnapshotMode; state?: SnapshotMode; leaveStance?: boolean; opponentFirst?: boolean; strength?: number } = {})
{
  const flatOffense = (id: string, bonus: number) => ({ ...makeOffense(id, 0, 0), damageBonus: { amount: 0, grade: 1, bonus, isPhantom: false } });
  const a: CombatantSnapshot = {
    ...makeSnapshot("A", {
      maxHp: 10_000, offense: flatOffense("a", 20), initiativeValue: options.opponentFirst ? -100 : 100,
      ...(options.strength ? { characteristics: { strength: { grade: 3, value: options.strength, bonus: 0, testBonus: 0 } } } : {}),
    }),
    // A second legal attack option makes the real engine consult the policy;
    // with only a basic attack it deliberately skips that callback.
    spells: [{ id: "observer-alternative", name: "Observer alternative", offense: makeOffense("spell", 0, 0), costEssence: 0, castTime: "Standardowa" }],
    stance: options.stance, state: options.state,
    stanceOptions: options.leaveStance ? [{ name: "Neutral", baseGrade: 1, variantsByGrade: { 1: [] } }] : [],
  };
  const original = structuredClone(a);
  const b = makeSnapshot("B", { maxHp: 10_000, offense: flatOffense("b", 30) });
  const frames: Frame[] = [];
  const policy: ActionPolicy = {
    name: "observe-pilot",
    chooseAction(self, _opponent, available)
    {
      const change = available.find(action => action.kind === "stanceChange");
      if (options.leaveStance && change) return change;
      const attack = available.find(action => action.kind === "attack");
      if (!attack) return available.find(action => action.kind === "pass") ?? available[0]!;
      const profiles = activeBuffProfiles(self);
      frames.push({
        resistance: effectiveDefense(self.snapshot.defenses[0]!, profiles).resistance,
        damage: effectiveOffense(self.snapshot.offenses[0]!, profiles).damageBonus.bonus - self.snapshot.offenses[0]!.damageBonus.bonus,
        buffs: profiles.length, stance: self.activeStance?.mode.name,
      });
      return attack;
    },
  };
  const log = runCombat(a, b, { seed: 42, policyA: policy, policyB: basicAttackPolicy, maxRounds: 4 });
  expect(a).toEqual(original);
  expect(frames).toHaveLength(4);
  return { frames, log };
}

it.each([1, 2, 4, 6, 8, 11].map((resistance, index) => ({ resistance, grade: index + 1 })))("applies defensive rank $grade every turn without accumulating: resistance $resistance", ({ resistance, grade }) =>
{
  const { frames, log } = fight({ stance: mode("Stance", grade) });
  expect(frames).toEqual(Array.from({ length: 4 }, () => ({ resistance, damage: -grade, buffs: 1, stance: "Postawa Defensywna" })));
  const attacks = log.events.filter(event => event.kind === "attack" && event.actorId === "A");
  expect(attacks.map(event => event.kind === "attack" ? event.raw : null)).toEqual([20 - grade, 20 - grade, 20 - grade, 20 - grade]);
});

it("adds state damage to the offense, independently of Strength and the stance slot", () =>
{
  const bare = fight({ strength: 12 });
  expect(bare.frames.every(frame => frame.damage === 0 && frame.buffs === 0)).toBe(true);
  const withState = fight({ state: mode("State", 1), strength: 12 });
  expect(withState.frames.every(frame => frame.damage === 2 && frame.buffs === 1)).toBe(true);
  const combined = fight({ stance: mode("Stance", 5), state: mode("State", 1) });
  expect(combined.frames.every(frame => frame.damage === -3 && frame.resistance === 8 && frame.buffs === 2)).toBe(true);
});

it("characterizes stance exit: old modifiers remain for this turn, then expire", () =>
{
  const { frames, log } = fight({ stance: mode("Stance", 5), leaveStance: true });
  expect(frames[0]).toEqual({ resistance: 8, damage: -5, buffs: 1, stance: "Neutral" });
  expect(frames.slice(1).every(frame => frame.resistance === 0 && frame.damage === 0 && frame.buffs === 0)).toBe(true);
  const attacks = log.events.filter(event => event.kind === "attack" && event.actorId === "B");
  expect(attacks.map(event => event.kind === "attack" ? event.resistance : null)).toEqual([8, 0, 0, 0]);
});

it("characterizes initiative timing: initial bonuses wait for the wearer's own turn", () =>
{
  const { log } = fight({ stance: mode("Stance", 5), leaveStance: true, opponentFirst: true });
  const incoming = log.events.filter(event => event.kind === "attack" && event.actorId === "B");
  expect(incoming.map(event => event.kind === "attack" ? event.resistance : null)).toEqual([0, 8, 0, 0]);
});

it("characterizes damage scope: a direct damage effect does not receive the offense-stat bonus", () =>
{
  const source = createRuntime(makeSnapshot("A"));
  const target = createRuntime(makeSnapshot("B"));
  const log = new CombatLogBuilder(1);
  const context = { random: () => 0.5, log };
  applyEffects(mode("State", 1).variantsByGrade[1]!, source, target, context);
  expect(effectiveOffense(source.snapshot.offenses[0]!, activeBuffProfiles(source)).damageBonus.bonus).toBe(2);
  applyEffects([{ type: "damage", damage: { amount: 0, grade: 0, bonus: 5 }, damageType: "nieuchronne" }], source, target, context);
  expect(log.build().events).toContainEqual(expect.objectContaining({ kind: "damage", amount: 5 }));
});
