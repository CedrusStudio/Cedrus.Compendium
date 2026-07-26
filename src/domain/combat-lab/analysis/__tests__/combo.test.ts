import { describe, it, expect } from "vitest";
import { computeComboGraph, topCombos } from "@/domain/combat-lab/analysis/combo";
import type { CombatLog, CombatEvent } from "@/domain/combat-lab/engine/CombatLog";

function log(events: CombatEvent[]): CombatLog {
  return { seed: 0, events, schemaVersion: 1 };
}

function maneuver(actorId: string, name: string): CombatEvent {
  return { kind: "maneuver", actorId, targetId: "x", maneuverId: name, maneuverName: name };
}

describe("computeComboGraph()", () => {
  it("counts maneuver usage and transitions per actor", () => {
    const graph = computeComboGraph([
      log([maneuver("a", "Bleed"), maneuver("a", "Execute"), maneuver("a", "Bleed")]),
    ]);

    expect(graph.nodes.find(n => n.id === "Bleed")?.count).toBe(2);
    expect(graph.nodes.find(n => n.id === "Execute")?.count).toBe(1);
    expect(graph.edges.find(e => e.id === "Bleed->Execute")?.count).toBe(1);
    expect(graph.edges.find(e => e.id === "Execute->Bleed")?.count).toBe(1);
    expect(graph.fights).toBe(1);
  });

  it("does not chain maneuvers across different actors", () => {
    const graph = computeComboGraph([
      log([maneuver("a", "A1"), maneuver("b", "B1"), maneuver("a", "A2")]),
    ]);
    // a: A1 -> A2 (b's maneuver in between must not create A1->B1 or B1->A2)
    expect(graph.edges.map(e => e.id).sort()).toEqual(["A1->A2"]);
  });

  it("aggregates transitions across fights and ranks them", () => {
    const graph = computeComboGraph([
      log([maneuver("a", "X"), maneuver("a", "Y")]),
      log([maneuver("a", "X"), maneuver("a", "Y")]),
      log([maneuver("a", "X"), maneuver("a", "Z")]),
    ]);
    const top = topCombos(graph, 5);
    expect(top[0]).toMatchObject({ id: "X->Y", count: 2 });
    expect(top[1]).toMatchObject({ id: "X->Z", count: 1 });
  });

  it("includes reaction events as maneuver nodes", () => {
    const graph = computeComboGraph([
      log([
        maneuver("a", "Setup"),
        { kind: "reaction", actorId: "a", targetId: "b", maneuverId: "Riposte", maneuverName: "Riposte" },
      ]),
    ]);
    expect(graph.edges.find(e => e.id === "Setup->Riposte")?.count).toBe(1);
  });
});
