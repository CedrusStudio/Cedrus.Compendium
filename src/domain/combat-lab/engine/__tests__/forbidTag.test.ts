import { describe, it, expect } from "vitest";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { availableProactiveManeuvers, availableStanceChanges, isTagForbidden } from "@/domain/combat-lab/engine/actionEconomy";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { basicAttackPolicy, greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { CombatantSnapshot, SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

const ctx = () => ({ random: createRng(1).next, log: new CombatLogBuilder(1) });

const maneuver = (id: string, name: string, tags: string[]): ManeuverDefinition => ({
  id, name, grade: 1, description: "", price: 1, tags,
  castTime: "Standardowa", cooldown: 0, cost: { castTime: "Standardowa" },
  hardRequirements: [],
  effects: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 3 }, damageType: "zwyczajne" }],
});

/** Amok, as authored in the library: bans everything tagged „defensywne". */
const amok: Effect[] = [{ type: "forbidTag", tag: "defensywne", scope: "all", duration: 0 }];

const stance = (name: string, tags: string[]): SnapshotMode =>
  ({ name, baseGrade: 1, variantsByGrade: { 1: [] }, tags });

describe("blokada po tagu (Amok)", () =>
{
  it("zapamiętuje blokadę na rzucającym", () =>
  {
    const self = createRuntime(makeSnapshot("A"));
    const other = createRuntime(makeSnapshot("B"));

    applyEffects(amok, self, other, ctx());

    expect(self.forbiddenTags).toEqual([{ tag: "defensywne", scope: "all", remaining: 0 }]);
    expect(other.forbiddenTags).toHaveLength(0);
  });

  it("nie rozpoznaje tagu, którego encja nie ma", () =>
  {
    const self = createRuntime(makeSnapshot("A"));
    applyEffects(amok, self, createRuntime(makeSnapshot("B")), ctx());

    expect(isTagForbidden(self, ["ofensywne"], "maneuvers")).toBe(false);
    expect(isTagForbidden(self, ["defensywne"], "maneuvers")).toBe(true);
  });

  it("ignoruje wielkość liter i spacje wokół tagu", () =>
  {
    const self = createRuntime(makeSnapshot("A"));
    applyEffects([{ type: "forbidTag", tag: " Defensywne ", duration: 0 }], self, createRuntime(makeSnapshot("B")), ctx());

    expect(isTagForbidden(self, ["defensywne"], "stances")).toBe(true);
  });

  it("wycina zablokowane manewry z dostępnych akcji", () =>
  {
    const defensive = maneuver("m1", "Zasłona", ["defensywne"]);
    const offensive = maneuver("m2", "Cios", ["ofensywne"]);
    const snap: CombatantSnapshot = { ...makeSnapshot("A"), maneuvers: [defensive, offensive] };

    const runtime = createRuntime(snap);
    expect(availableProactiveManeuvers(runtime)).toHaveLength(2);

    applyEffects(amok, runtime, createRuntime(makeSnapshot("B")), ctx());

    const left = availableProactiveManeuvers(runtime);
    expect(left).toHaveLength(1);
    expect(left[0]).toMatchObject({ kind: "maneuver", maneuver: { name: "Cios" } });
  });

  it("blokuje wejście w zakazaną postawę, ale nie w pozostałe", () =>
  {
    const snap: CombatantSnapshot = {
      ...makeSnapshot("A"),
      stanceOptions: [stance("Mur Tarcz", ["defensywne"]), stance("Furia", ["ofensywne"])],
    };
    const runtime = createRuntime(snap);
    applyEffects(amok, runtime, createRuntime(makeSnapshot("B")), ctx());

    const changes = availableStanceChanges(runtime);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: "stanceChange", stance: { name: "Furia" } });
  });

  it("zakres „manewry\" nie rusza postaw", () =>
  {
    const snap: CombatantSnapshot = { ...makeSnapshot("A"), stanceOptions: [stance("Mur Tarcz", ["defensywne"])] };
    const runtime = createRuntime(snap);
    applyEffects([{ type: "forbidTag", tag: "defensywne", scope: "maneuvers", duration: 0 }], runtime, createRuntime(makeSnapshot("B")), ctx());

    expect(availableStanceChanges(runtime)).toHaveLength(1);
  });

  it("blokada podtrzymywana przez stan trwa całą walkę, bo stan odnawia ją co turę", () =>
  {
    const defensive = maneuver("m1", "Zasłona", ["defensywne"]);
    const base = { ...makeSnapshot("A", { maxHp: 80 }), maneuvers: [defensive] };
    const b = makeSnapshot("B", { maxHp: 80 });

    const usesManeuver = (a: CombatantSnapshot) =>
      runCombat(a, b, { seed: 3, policyA: greedyDamagePolicy, policyB: basicAttackPolicy, maxRounds: 5 })
        .events.some(e => e.kind === "maneuver" && e.actorId === "A");

    // Kontrola: bez Amoku ten sam manewr jest używany — inaczej test niczego nie dowodzi.
    expect(usesManeuver(base)).toBe(true);

    const inAmok: CombatantSnapshot = { ...base, state: { name: "Amok", baseGrade: 1, variantsByGrade: { 1: amok } } };
    expect(usesManeuver(inAmok)).toBe(false);
  });
});
