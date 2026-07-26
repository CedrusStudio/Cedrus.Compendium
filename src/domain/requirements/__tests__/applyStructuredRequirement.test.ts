import { describe, expect, it } from "vitest";
import type { Requirement } from "@/domain/requirements/Requirement";
import { applyStructuredRequirement } from "@/domain/requirements/applyStructuredRequirement";
import { formatRequirement } from "@/domain/requirements/formatRequirement";

const ranked: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 };

describe("applyStructuredRequirement", () => {
  it("removes the legacy text and replaces its rankless mirror with the ranked requirement", () => {
    const result = applyStructuredRequirement(
      { requirements: ["Siła 3", "Lekka zbroja"], structuredRequirements: [{ kind: "rankless", text: "siła 3" }, { kind: "rankless", text: "lekka zbroja" }] },
      "Siła 3",
      ranked,
    );

    expect(result.requirements).toEqual(["Lekka zbroja"]);
    expect(result.structuredRequirements).toEqual([{ kind: "rankless", text: "lekka zbroja" }, ranked]);
  });

  it("adds the ranked requirement when there is no rankless mirror", () => {
    const result = applyStructuredRequirement(
      { requirements: ["Siła 3"], structuredRequirements: [] },
      "Siła 3",
      ranked,
    );

    expect(result.requirements).toEqual([]);
    expect(result.structuredRequirements).toEqual([ranked]);
  });

  it("does not duplicate an already-present equal requirement", () => {
    const result = applyStructuredRequirement(
      { requirements: ["Siła 3"], structuredRequirements: [ranked] },
      "Siła 3",
      ranked,
    );

    expect(result.structuredRequirements).toEqual([ranked]);
  });

  it("tolerates null/absent fields", () => {
    const result = applyStructuredRequirement({}, "Siła 3", ranked);
    expect(result.requirements).toEqual([]);
    expect(result.structuredRequirements).toEqual([ranked]);
  });

  it("keeps the legacy text when the result is rankless (text stays displayed)", () => {
    const rankless: Requirement = { kind: "rankless", text: "lekka zbroja" };
    const result = applyStructuredRequirement(
      { requirements: ["Lekka zbroja"], structuredRequirements: [{ kind: "rankless", text: "lekka zbroja" }] },
      "Lekka zbroja",
      rankless,
    );

    expect(result.requirements).toEqual(["Lekka zbroja"]);
    expect(result.structuredRequirements).toEqual([rankless]);
  });

  it("matches the rankless mirror case-insensitively", () => {
    const result = applyStructuredRequirement(
      { requirements: ["Siła 3"], structuredRequirements: [{ kind: "rankless", text: "SIŁA   3" }] },
      "Siła 3",
      ranked,
    );

    expect(result.structuredRequirements).toEqual([ranked]);
  });
});

describe("formatRequirement", () => {
  it("renders rankless as its text", () => {
    expect(formatRequirement({ kind: "rankless", text: "Lekka zbroja" })).toBe("Lekka zbroja");
  });

  it("renders a ranked characteristic with its Polish label", () => {
    expect(formatRequirement({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 })).toBe("siła ≥ 3");
  });

  it("renders a ranked attribute with its Polish label", () => {
    expect(formatRequirement({ kind: "ranked", group: "attributes", targetKey: "fencing", value: 2 })).toBe("fechtunek ≥ 2");
  });

  it("renders a ranked entity by its name", () => {
    expect(formatRequirement({ kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 })).toBe("Cios Tarczą ≥ 2");
  });
});
