import { describe, it, expect } from "vitest";
import { computeBalanceHealth } from "@/domain/combat-lab/analysis/balanceHealth";
import type { MetaReport } from "@/domain/combat-lab/analysis/meta";

const report = (ranking: { id: string; name: string; averageWinRate: number }[], over: Partial<MetaReport> = {}): MetaReport => ({
  ranking, mostUsedManeuvers: [], neverUsedManeuvers: [], mostUsedSpells: [], neverUsedSpells: [], totalFights: 0, count: 0, ...over,
});

describe("computeBalanceHealth()", () => {
  it("scores a perfectly balanced roster near 100 / zdrowy", () => {
    const h = computeBalanceHealth(report([
      { id: "a", name: "A", averageWinRate: 0.5 },
      { id: "b", name: "B", averageWinRate: 0.5 },
    ]));
    expect(h.score).toBe(100);
    expect(h.verdict).toBe("zdrowy");
    expect(h.overpowered).toHaveLength(0);
  });

  it("flags over/under-powered builds and lowers the score", () => {
    const h = computeBalanceHealth(report([
      { id: "op", name: "OP", averageWinRate: 0.8 },
      { id: "up", name: "UP", averageWinRate: 0.2 },
    ]));
    expect(h.overpowered.map(r => r.id)).toEqual(["op"]);
    expect(h.underpowered.map(r => r.id)).toEqual(["up"]);
    expect(h.score).toBeLessThan(50);
    expect(h.verdict).toBe("niezbalansowany");
  });

  it("reports dominant maneuvers with their usage share and dead count", () => {
    const h = computeBalanceHealth(report([{ id: "a", name: "A", averageWinRate: 0.5 }], {
      mostUsedManeuvers: [{ name: "Cios", count: 75 }, { name: "Blok", count: 25 }],
      neverUsedManeuvers: ["Nieużywany 1", "Nieużywany 2"],
    }));
    expect(h.dominantManeuvers[0]).toEqual({ name: "Cios", share: 0.75 });
    expect(h.deadManeuverCount).toBe(2);
  });
});
