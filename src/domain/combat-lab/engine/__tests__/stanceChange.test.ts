import { describe, it, expect } from "vitest";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { basicAttackPolicy, valuePolicy, type ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import type { CombatantSnapshot, SnapshotMode } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { CombatEvent } from "@/domain/combat-lab/engine/CombatLog";

const prot = (n: number): Effect[] => [{ type: "stat", mode: "self", duration: 1, protection: n }];

const stance = (name: string, effects: Effect[], baseGrade = 1): SnapshotMode =>
  ({ name, baseGrade, variantsByGrade: { [baseGrade]: effects } });

const defensive = stance("Defensywna", prot(6));
const aggressive = stance("Agresywna", prot(0));

function withStances(snap: CombatantSnapshot, active: SnapshotMode | undefined, options: SnapshotMode[]): CombatantSnapshot
{
  return { ...snap, stance: active, stanceOptions: options };
}

/** Takes every stance change offered — isolates the timing rule from any valuation. */
const alwaysChangePolicy: ActionPolicy =
{
  name: "alwaysChange",
  chooseAction(_self, _opponent, available)
  {
    return available.find(a => a.kind === "stanceChange") ?? available.find(a => a.kind === "attack") ?? available[0]!;
  },
};

/**
 * Pierwszą zmianę robi po ataku, potem łapczywie bierze pierwsze zaproponowane
 * okno. Licznik w domknięciu jest deterministyczny, bo walka jest deterministyczna.
 */
function afterAttackThenEagerPolicy(): ActionPolicy
{
  let changes = 0;

  return {
    name: "afterAttackThenEager",
    chooseAction(self, _opponent, available)
    {
      const change = available.find(a => a.kind === "stanceChange");
      if (change && (changes > 0 || self.attackedThisTurn))
      {
        changes += 1;
        return change;
      }
      return available.find(a => a.kind === "attack") ?? available[0]!;
    },
  };
}

/** Declines the pre-attack window, takes the post-attack one (the attack is already spent there). */
const afterAttackOnlyPolicy: ActionPolicy =
{
  name: "afterAttackOnly",
  chooseAction(self, _opponent, available)
  {
    if (self.attackedThisTurn)
    {
      const change = available.find(a => a.kind === "stanceChange");
      if (change) return change;
    }
    return available.find(a => a.kind === "attack") ?? available[0]!;
  },
};

const changesOf = (events: CombatEvent[], actorId: string) =>
  events.filter((e): e is Extract<CombatEvent, { kind: "stanceChange" }> => e.kind === "stanceChange" && e.actorId === actorId);

const roundOf = (events: CombatEvent[], index: number): number =>
{
  let round = 0;
  for (let i = 0; i <= index; i++)
  {
    const event = events[i]!;
    if (event.kind === "roundStart") round = event.round;
  }
  return round;
};

describe("zmiana postawy w turze", () =>
{
  it("nie ma czego zmieniać bez repertuaru", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 60 }), defensive, []);
    const b = makeSnapshot("B", { maxHp: 60 });

    const log = runCombat(a, b, { seed: 5, policyA: alwaysChangePolicy, policyB: basicAttackPolicy, maxRounds: 3 });

    expect(changesOf(log.events, "A")).toHaveLength(0);
  });

  it("nie proponuje postawy, w której już się stoi", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 60 }), defensive, [defensive]);
    const b = makeSnapshot("B", { maxHp: 60 });

    const log = runCombat(a, b, { seed: 5, policyA: alwaysChangePolicy, policyB: basicAttackPolicy, maxRounds: 3 });

    expect(changesOf(log.events, "A")).toHaveLength(0);
  });

  it("zmienia najwyżej raz na turę, w oknie przed atakiem", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 80 }), defensive, [defensive, aggressive]);
    const b = makeSnapshot("B", { maxHp: 80 });

    const log = runCombat(a, b, { seed: 7, policyA: alwaysChangePolicy, policyB: basicAttackPolicy, maxRounds: 4 });
    const changes = changesOf(log.events, "A");

    expect(changes.length).toBeGreaterThan(0);
    expect(changes.every(c => c.timing === "beforeAttack")).toBe(true);

    // Jedna zmiana na rundę — okno po ataku jest już zamknięte.
    const rounds = log.events.map((e, i) => (e.kind === "stanceChange" && e.actorId === "A" ? roundOf(log.events, i) : null)).filter((r): r is number => r !== null);
    expect(new Set(rounds).size).toBe(rounds.length);
  });

  it("po zmianie w oknie po ataku następna tura nie oddaje okna przed atakiem", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 120 }), defensive, [defensive, aggressive]);
    const b = makeSnapshot("B", { maxHp: 120 });

    // Pierwszą zmianę wymuszamy po ataku, każdą kolejną polityka bierze z PIERWSZEGO
    // zaproponowanego okna — czyli sięgnęłaby po okno przed atakiem, gdyby było otwarte.
    // Skoro wszystkie kolejne zmiany i tak lądują po ataku, blokada działa.
    const log = runCombat(a, b, { seed: 9, policyA: afterAttackThenEagerPolicy(), policyB: basicAttackPolicy, maxRounds: 6 });
    const changes = changesOf(log.events, "A");

    expect(changes.length).toBeGreaterThan(1);
    expect(changes.map(c => c.timing)).toEqual(changes.map(() => "afterAttack"));
  });

  it("każda zmiana zajmuje osobną turę", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 120 }), defensive, [defensive, aggressive]);
    const b = makeSnapshot("B", { maxHp: 120 });

    const log = runCombat(a, b, { seed: 9, policyA: afterAttackOnlyPolicy, policyB: basicAttackPolicy, maxRounds: 6 });

    const rounds = log.events
      .map((e, i) => (e.kind === "stanceChange" && e.actorId === "A" ? roundOf(log.events, i) : null))
      .filter((r): r is number => r !== null);

    expect(rounds.length).toBeGreaterThan(0);
    expect(new Set(rounds).size).toBe(rounds.length);
  });

  it("efekty nowej postawy działają od razu, nie dopiero od następnej tury", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 60 }), aggressive, [aggressive, defensive]);
    const b = makeSnapshot("B", { maxHp: 60 });

    const log = runCombat(a, b, { seed: 13, policyA: alwaysChangePolicy, policyB: basicAttackPolicy, maxRounds: 2 });

    const firstChange = log.events.findIndex(e => e.kind === "stanceChange" && e.actorId === "A");
    expect(firstChange).toBeGreaterThan(-1);

    const buffAfterChange = log.events
      .slice(firstChange + 1)
      .findIndex(e => e.kind === "buff" && e.targetId === "A");
    expect(buffAfterChange).toBe(0);
  });

  it("polityka wartościująca nie zamienia postawy na słabszą", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 60 }), defensive, [defensive, aggressive]);
    const b = makeSnapshot("B", { maxHp: 60 });

    const log = runCombat(a, b, { seed: 17, policyA: valuePolicy, policyB: basicAttackPolicy, maxRounds: 4 });

    expect(changesOf(log.events, "A")).toHaveLength(0);
  });

  it("polityka wartościująca wchodzi w postawę lepszą od obecnej", () =>
  {
    const a = withStances(makeSnapshot("A", { maxHp: 60 }), aggressive, [aggressive, defensive]);
    const b = makeSnapshot("B", { maxHp: 60 });

    const log = runCombat(a, b, { seed: 17, policyA: valuePolicy, policyB: basicAttackPolicy, maxRounds: 4 });
    const changes = changesOf(log.events, "A");

    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0]!.to).toBe("Defensywna");
    expect(changes[0]!.from).toBe("Agresywna");
  });
});
