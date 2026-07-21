import { describe, it, expect } from "vitest";
import { toCsv, objectsToCsv, rawResultsToCsv, matchupToCsv } from "@/domain/combat-lab/export/toCsv";
import type { RawResult } from "@/domain/combat-lab/simulation/RawResult";
import type { MatchupMatrix } from "@/domain/combat-lab/analysis/matchup";

describe("toCsv()", () => {
  it("joins rows and fields", () => {
    expect(toCsv([["a", "b"], [1, 2]])).toBe("a,b\n1,2");
  });

  it("quotes fields with commas, quotes or newlines and doubles quotes", () => {
    expect(toCsv([["a,b", 'he said "hi"', "line1\nline2"]])).toBe('"a,b","he said ""hi""","line1\nline2"');
  });

  it("renders null/undefined as empty", () => {
    expect(toCsv([[null, undefined, 0]])).toBe(",,0");
  });
});

describe("objectsToCsv()", () => {
  it("maps columns in order with headers", () => {
    const rows = [{ a: 1, b: "x" }, { a: 2, b: "y" }];
    const csv = objectsToCsv(rows, [{ key: "b", header: "B" }, { key: "a", header: "A" }]);
    expect(csv).toBe("B,A\nx,1\ny,2");
  });
});

describe("serializers", () => {
  it("rawResultsToCsv has a header and one row per result", () => {
    const results: RawResult[] = [
      { seed: 0, winnerId: "a", reason: "knockout", rounds: 3, winnerRemainingHp: 10, deathCause: "weapon", maneuverUsage: {}, schemaVersion: 1 },
    ];
    const csv = rawResultsToCsv(results);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("seed,winner,reason,rounds,winnerHp,deathCause");
    expect(lines[1]).toBe("0,a,knockout,3,10,weapon");
  });

  it("matchupToCsv renders the grid with names and blank diagonal", () => {
    const matrix: MatchupMatrix = {
      combatants: [{ id: "a", name: "A" }, { id: "b", name: "B" }],
      winRates: [[null, 0.6], [0.4, null]],
      count: 100,
      schemaVersion: 1,
    };
    const csv = matchupToCsv(matrix);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("A \\ B,A,B");
    expect(lines[1]).toBe("A,,60");
    expect(lines[2]).toBe("B,40,");
  });
});
