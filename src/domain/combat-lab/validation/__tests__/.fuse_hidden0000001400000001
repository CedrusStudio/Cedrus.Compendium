import { describe, it, expect } from "vitest";
import { validateManeuvers, countBySeverity } from "@/domain/combat-lab/validation/rulesValidator";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

const maneuver = (id: string, effects: Effect[], over: Partial<ManeuverDefinition> = {}): ManeuverDefinition => ({
  id, name: id, grade: 1, description: "", requirements: [], price: 1, tags: [],
  castTime: "Standardowa", cooldown: 1, cost: { castTime: "Standardowa" }, hardRequirements: [], effects, ...over,
});

describe("validateManeuvers()", () => {
  it("flags a maneuver with no effects as a dead mechanic", () => {
    const issues = validateManeuvers([maneuver("empty", [])]);
    expect(issues.some(i => i.code === "no-effects" && i.maneuverId === "empty")).toBe(true);
  });

  it("flags a buff referencing a missing profile as an error", () => {
    const issues = validateManeuvers(
      [maneuver("buffer", [{ type: "buff", profile: { profileId: "ghost" }, duration: 2 }])],
      { buffProfileIds: new Set(["real"]) },
    );
    expect(issues.some(i => i.code === "missing-profile" && i.severity === "error")).toBe(true);
  });

  it("accepts a buff whose profile exists", () => {
    const issues = validateManeuvers(
      [maneuver("buffer", [{ type: "buff", profile: { profileId: "real" }, duration: 2 }])],
      { buffProfileIds: new Set(["real"]) },
    );
    expect(issues.some(i => i.code === "missing-profile")).toBe(false);
  });

  it("flags an empty chance branch and a zero-duration status", () => {
    const issues = validateManeuvers([
      maneuver("c", [{ type: "chance", chance: 50, then: [] }]),
      maneuver("s", [{ type: "status", status: "bleeding", duration: 0 }]),
    ]);
    expect(issues.some(i => i.code === "empty-chance")).toBe(true);
    expect(issues.some(i => i.code === "zero-duration")).toBe(true);
  });

  it("flags duplicate maneuver names", () => {
    const issues = validateManeuvers([
      maneuver("a", [{ type: "push", distance: 1 }], { name: "Cios" }),
      maneuver("b", [{ type: "push", distance: 1 }], { name: "Cios" }),
    ]);
    expect(issues.some(i => i.code === "duplicate-name")).toBe(true);
  });

  it("flags a negative cooldown as an error", () => {
    const issues = validateManeuvers([maneuver("x", [{ type: "push", distance: 1 }], { cooldown: -2 })]);
    expect(issues.some(i => i.code === "negative-cooldown" && i.severity === "error")).toBe(true);
  });

  it("sorts errors before warnings and counts by severity", () => {
    const issues = validateManeuvers(
      [maneuver("x", [], { cooldown: -1 })],
    );
    expect(issues[0]!.severity).toBe("error");
    const counts = countBySeverity(issues);
    expect(counts.error).toBeGreaterThanOrEqual(1);
    expect(counts.warning).toBeGreaterThanOrEqual(1);
  });

  it("returns no issues for a clean maneuver", () => {
    const issues = validateManeuvers([maneuver("ok", [{ type: "damage", damage: { amount: 1, grade: 3, bonus: 2 }, damageType: "zwyczajne" }])]);
    expect(issues).toHaveLength(0);
  });
});
