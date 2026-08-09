import { describe, it, expect } from "vitest";
import { createRuntime, tickForbiddenActions } from "@/domain/combat-lab/engine/CombatState";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import {
  availableProactiveManeuvers,
  availableReactiveManeuvers,
  availableStanceChanges,
  isActionForbidden,
} from "@/domain/combat-lab/engine/actionEconomy";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { basicAttackPolicy, greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { CombatantSnapshot, SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

const ctx = () => ({ random: createRng(1).next, log: new CombatLogBuilder(1) });

const maneuver = (id: string, name: string, castTime: "Standardowa" | "Natychmiastowa"): ManeuverDefinition => ({
  id, name, grade: 1, description: "", price: 1, tags: ["ofensywa"],
  castTime, cooldown: 0, cost: { castTime },
  hardRequirements: [],
  effects: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 3 }, damageType: "zwyczajne" }],
});

/** Pełna Defensywna, as authored: forbids attacking for as long as it is worn. */
const noAttack: Effect[] = [{ type: "forbidAction", action: "attack", duration: 0 }];

const stance = (name: string, effects: Effect[] = []): SnapshotMode =>
  ({ name, baseGrade: 1, variantsByGrade: { 1: effects } });

describe("blokada akcji (Pełna Defensywna)", () =>
{
  it("zapamiętuje zakaz na noszącym, nie na przeciwniku", () =>
  {
    const self = createRuntime(makeSnapshot("A"));
    const other = createRuntime(makeSnapshot("B"));

    applyEffects(noAttack, self, other, ctx());

    expect(self.forbiddenActions).toEqual([{ action: "attack", remaining: 0 }]);
    expect(other.forbiddenActions).toHaveLength(0);
    expect(isActionForbidden(self, "attack")).toBe(true);
    expect(isActionForbidden(self, "maneuvers")).toBe(false);
  });

  it("scala powtórzony zakaz, zostawiając dłuższy czas", () =>
  {
    const self = createRuntime(makeSnapshot("A"));
    const other = createRuntime(makeSnapshot("B"));

    applyEffects([{ type: "forbidAction", action: "attack", duration: 1 }], self, other, ctx());
    applyEffects([{ type: "forbidAction", action: "attack", duration: 3 }], self, other, ctx());
    applyEffects([{ type: "forbidAction", action: "attack", duration: 2 }], self, other, ctx());

    expect(self.forbiddenActions).toEqual([{ action: "attack", remaining: 3 }]);
  });

  it("zakaz manewrów wycina i proaktywne, i reaktywne", () =>
  {
    const snap: CombatantSnapshot = {
      ...makeSnapshot("A"),
      maneuvers: [maneuver("m1", "Cios", "Standardowa"), maneuver("m2", "Riposta", "Natychmiastowa")],
    };
    const runtime = createRuntime(snap);

    // Kontrola: bez zakazu obie listy coś mają — inaczej test niczego nie dowodzi.
    expect(availableProactiveManeuvers(runtime)).toHaveLength(1);
    expect(availableReactiveManeuvers(runtime)).toHaveLength(1);

    applyEffects([{ type: "forbidAction", action: "maneuvers", duration: 0 }], runtime, createRuntime(makeSnapshot("B")), ctx());

    expect(availableProactiveManeuvers(runtime)).toEqual([]);
    expect(availableReactiveManeuvers(runtime)).toEqual([]);
  });

  it("zakaz zmiany postawy zostawia repertuar nietknięty, ale niedostępny", () =>
  {
    const snap: CombatantSnapshot = { ...makeSnapshot("A"), stanceOptions: [stance("Furia"), stance("Mur Tarcz")] };
    const runtime = createRuntime(snap);
    expect(availableStanceChanges(runtime)).toHaveLength(2);

    applyEffects([{ type: "forbidAction", action: "stanceChange", duration: 0 }], runtime, createRuntime(makeSnapshot("B")), ctx());

    expect(availableStanceChanges(runtime)).toEqual([]);
    expect(runtime.snapshot.stanceOptions).toHaveLength(2);
  });

  it("zakaz ataku faktycznie usuwa ataki z walki i loguje pas z powodem", () =>
  {
    const b = makeSnapshot("B", { maxHp: 200 });
    const base = makeSnapshot("A", { maxHp: 200 });

    const attacksOf = (a: CombatantSnapshot) =>
      runCombat(a, b, { seed: 7, policyA: greedyDamagePolicy, policyB: basicAttackPolicy, maxRounds: 4 })
        .events.filter(e => (e.kind === "attack" || e.kind === "rangedAttack") && e.actorId === "A");

    // Kontrola: bez postawy A normalnie atakuje.
    expect(attacksOf(base).length).toBeGreaterThan(0);

    const defensive: CombatantSnapshot = { ...base, stance: stance("Pełna Defensywna", noAttack) };
    expect(attacksOf(defensive)).toEqual([]);

    const log = runCombat(defensive, b, { seed: 7, policyA: greedyDamagePolicy, policyB: basicAttackPolicy, maxRounds: 4 });
    // Aktor jest w pełni przytomny, więc bez osobnej gałęzi tura znikałaby z logu.
    expect(log.events.some(e => e.kind === "pass" && e.actorId === "A" && e.reason === "attackForbidden")).toBe(true);
  });

  it("zakaz podtrzymywany przez postawę znika po jej zdjęciu", () =>
  {
    const runtime = createRuntime(makeSnapshot("A"));
    applyEffects(noAttack, runtime, createRuntime(makeSnapshot("B")), ctx());
    expect(isActionForbidden(runtime, "attack")).toBe(true);

    // Tick kasuje wpisy z `remaining: 0`; postawa odnawia je zaraz potem, więc
    // zakaz kończy się dokładnie w turze po wyjściu z niej. Wołamy tę samą
    // funkcję, którą wywołuje silnik — kopia w teście mogłaby się rozjechać.
    tickForbiddenActions(runtime);

    expect(isActionForbidden(runtime, "attack")).toBe(false);
  });

  it("zakaz na czas określony wygasa po zadanej liczbie tur", () =>
  {
    const snap: CombatantSnapshot = { ...makeSnapshot("A"), maneuvers: [maneuver("m1", "Cios", "Standardowa")] };
    const runtime = createRuntime(snap);
    applyEffects([{ type: "forbidAction", action: "maneuvers", duration: 2 }], runtime, createRuntime(makeSnapshot("B")), ctx());

    tickForbiddenActions(runtime);
    expect(availableProactiveManeuvers(runtime)).toEqual([]);
    tickForbiddenActions(runtime);
    expect(availableProactiveManeuvers(runtime)).toHaveLength(1);
  });
});
