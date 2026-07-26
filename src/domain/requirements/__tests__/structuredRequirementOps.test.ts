import { describe, expect, it } from "vitest";
import type { Requirement } from "@/domain/requirements/Requirement";
import { dedupeRequirements, removeStructuredRequirement, replaceStructuredRequirement } from "@/domain/requirements/structuredRequirementOps";

const rankless: Requirement = { kind: "rankless", text: "lekka zbroja" };
const ranked: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 };
const other: Requirement = { kind: "rankless", text: "coś innego" };

describe("structuredRequirementOps", () => {
  describe("replaceStructuredRequirement", () => {
    it("replaces the matching entry, keeps the rest", () => {
      expect(replaceStructuredRequirement([rankless, other], rankless, ranked)).toEqual([ranked, other]);
    });

    it("matches rankless case-insensitively", () => {
      expect(replaceStructuredRequirement([{ kind: "rankless", text: "LEKKA  zbroja" }], rankless, ranked)).toEqual([ranked]);
    });

    it("dedupes when the replacement already exists", () => {
      expect(replaceStructuredRequirement([rankless, ranked], rankless, ranked)).toEqual([ranked]);
    });

    it("is a no-op (deduped) when the original is absent", () => {
      expect(replaceStructuredRequirement([other], rankless, ranked)).toEqual([other]);
    });

    it("splits one entry into several, since the array is already a conjunction", () => {
      // This is how a compound legacy text becomes two independent requirements
      // without an `allOf` variant duplicating what the array already means.
      const second: Requirement = { kind: "ranked", group: "attributes", targetKey: "fencing", value: 2 };
      expect(replaceStructuredRequirement([rankless, other], rankless, [ranked, second]))
        .toEqual([ranked, second, other]);
    });

    it("dedupes a split against entries already present", () => {
      expect(replaceStructuredRequirement([rankless, other], rankless, [other, ranked]))
        .toEqual([other, ranked]);
    });

    it("tolerates null", () => {
      expect(replaceStructuredRequirement(null, rankless, ranked)).toEqual([]);
    });
  });

  describe("removeStructuredRequirement", () => {
    it("removes the matching entry", () => {
      expect(removeStructuredRequirement([rankless, other], rankless)).toEqual([other]);
    });

    it("removes a ranked entry by group/targetKey/value", () => {
      expect(removeStructuredRequirement([ranked, other], { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 })).toEqual([other]);
    });

    it("tolerates null", () => {
      expect(removeStructuredRequirement(null, rankless)).toEqual([]);
    });
  });

  describe("dedupeRequirements", () => {
    it("collapses structurally equal entries", () => {
      expect(dedupeRequirements([ranked, { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 }, other])).toEqual([ranked, other]);
    });
  });
});
