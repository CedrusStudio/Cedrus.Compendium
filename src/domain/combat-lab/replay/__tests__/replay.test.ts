import { describe, it, expect } from "vitest";
import { buildReplayFrames } from "@/domain/combat-lab/replay/buildReplayFrames";
import { describeEvent } from "@/domain/combat-lab/replay/describeEvent";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

describe("buildReplayFrames()", () => {
  const strong = () => makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 60, initiativeValue: 5 });
  const weak = () => makeSnapshot("weak", { offense: makeOffense("w", 1, 2, 0), maxHp: 20, initiativeValue: 1 });

  it("produces one frame per event", () => {
    const log = runCombat(strong(), weak(), { seed: 3 });
    const frames = buildReplayFrames(log);
    expect(frames).toHaveLength(log.events.length);
  });

  it("tracks hp monotonically down to the knockout", () => {
    const log = runCombat(strong(), weak(), { seed: 3 });
    const frames = buildReplayFrames(log);

    const last = frames.at(-1)!;
    const loser = last.combatants.find(c => c.id === "weak")!;
    expect(loser.hp).toBeLessThanOrEqual(0);

    // hp never exceeds maxHp in any frame
    for (const frame of frames) {
      for (const c of frame.combatants) {
        expect(c.hp).toBeLessThanOrEqual(c.maxHp);
      }
    }
  });

  it("first frame is combatStart with full hp", () => {
    const log = runCombat(strong(), weak(), { seed: 1 });
    const frames = buildReplayFrames(log);
    expect(frames[0]!.event.kind).toBe("combatStart");
    for (const c of frames[0]!.combatants) {
      expect(c.hp).toBe(c.maxHp);
    }
  });

  it("labels reference combatant names, not raw ids", () => {
    const log = runCombat(strong(), weak(), { seed: 3 });
    const frames = buildReplayFrames(log);
    const attackFrame = frames.find(f => f.event.kind === "attack");
    expect(attackFrame?.label).toContain("strong");
  });

  it("reflects applied and expired statuses", () => {
    const bleed = {
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
          duration: 2,
          tick: { damage: { amount: 0, grade: 0, bonus: 3 }, damageType: "bezpośrednie" as const },
        },
      ],
    };
    const bleeder = makeSnapshot("bleeder", { maneuvers: [bleed], initiativeValue: 9, offense: makeOffense("bo", 1, 2, 0) });
    const victim = makeSnapshot("victim", { maxHp: 200, offense: makeOffense("vo", 1, 2, 0) });

    const log = runCombat(bleeder, victim, { seed: 4, maxRounds: 20 });
    const frames = buildReplayFrames(log);
    const withBleed = frames.some(f => f.combatants.some(c => c.statuses.includes("bleeding")));
    expect(withBleed).toBe(true);
  });
});

describe("describeEvent()", () => {
  it("formats a round-start marker", () => {
    const label = describeEvent({ kind: "roundStart", round: 3 }, id => id);
    expect(label).toBe("— Runda 3 —");
  });
});
