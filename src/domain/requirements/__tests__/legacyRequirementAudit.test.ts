import { describe, expect, it } from "vitest";
import {
  auditRankedMappings,
  classifyLegacyRecord,
  findUncoveredLegacyTexts,
  isLegacyTextCovered,
  needsBackfill,
  planBackfill,
  readLegacyTexts,
  readStructuredRequirements,
  toRanklessRequirements,
} from "@/domain/requirements/legacyRequirementAudit";

/** The production record that exposed the record-level backfill bug. */
const POGROMIENIE = {
  requirements: ["Większy Fechtunek 2"],
  structuredRequirements: [{ kind: "ranked", group: "characteristics", targetKey: "strength", value: 2 }],
} as const;

describe("legacyRequirementAudit", () => {
  describe("classifyLegacyRecord", () => {
    it("flags a record with legacy text and no structured entries as orphaned", () => {
      // The production `Akrobatyka` case: invisible in the compendium.
      const doc = { requirements: ["Nieuchwytność", "Lekka zbroja"] };
      expect(classifyLegacyRecord(doc)).toBe("orphaned");
    });

    it("flags a record whose structured entry does not account for its legacy text as partial", () => {
      // `Pogromienie` looks migrated but "Większy Fechtunek 2" is represented
      // nowhere — a record-level "has anything structured?" check misses this.
      expect(classifyLegacyRecord(POGROMIENIE)).toBe("partial");
    });

    it("flags a record whose structured entries cover every legacy text as duplicated", () => {
      const doc = {
        requirements: ["Większy Fechtunek 2"],
        structuredRequirements: [{ kind: "ranked", group: "attributes", targetKey: "fencing", value: 2 }],
      };
      expect(classifyLegacyRecord(doc)).toBe("duplicated");
    });

    it("treats a missing, null or empty legacy array as clean", () => {
      expect(classifyLegacyRecord({})).toBe("clean");
      expect(classifyLegacyRecord({ requirements: null })).toBe("clean");
      expect(classifyLegacyRecord({ requirements: [] })).toBe("clean");
    });

    it("ignores blank legacy strings", () => {
      expect(classifyLegacyRecord({ requirements: ["   ", ""] })).toBe("clean");
    });
  });

  describe("isLegacyTextCovered", () => {
    it("accepts a verbatim rankless mirror", () => {
      expect(isLegacyTextCovered("Lekka zbroja", [{ kind: "rankless", text: "lekka zbroja" }])).toBe(true);
    });

    it("accepts a ranked entry whose stat label appears in the text", () => {
      expect(isLegacyTextCovered("Siła 3", [{ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 }])).toBe(true);
    });

    it("accepts a ranked entry whose entity name appears in the text", () => {
      expect(isLegacyTextCovered("Zapał Wojownika 2", [{ kind: "ranked", group: "perks", targetKey: "Zapał Wojownika", value: 2 }])).toBe(true);
    });

    it("still counts as covered when only the rank is wrong — the requirement is displayed either way", () => {
      expect(isLegacyTextCovered("Siła 3", [{ kind: "ranked", group: "characteristics", targetKey: "strength", value: 9 }])).toBe(true);
    });

    it("rejects a ranked entry pointing at an unrelated target", () => {
      expect(isLegacyTextCovered("Większy Fechtunek 2", POGROMIENIE.structuredRequirements)).toBe(false);
    });
  });

  describe("readStructuredRequirements", () => {
    it("returns an empty array for the Json? null Prisma hands back", () => {
      expect(readStructuredRequirements({ structuredRequirements: null })).toEqual([]);
    });

    it("drops malformed entries instead of throwing", () => {
      const doc = {
        structuredRequirements: [
          { kind: "rankless", text: "lekka zbroja" },
          { kind: "ranked", group: "characteristics", targetKey: "strength" },
          { kind: "nonsense" },
          null,
          "plain string",
        ],
      };
      expect(readStructuredRequirements(doc)).toEqual([{ kind: "rankless", text: "lekka zbroja" }]);
    });
  });

  describe("readLegacyTexts", () => {
    it("keeps only non-blank strings", () => {
      expect(readLegacyTexts({ requirements: ["Siła 3", "", 7, null, "  "] })).toEqual(["Siła 3"]);
    });
  });

  describe("toRanklessRequirements", () => {
    it("normalizes and wraps each text", () => {
      expect(toRanklessRequirements(["  Lekka   Zbroja ", "Nieuchwytność"])).toEqual([
        { kind: "rankless", text: "lekka zbroja" },
        { kind: "rankless", text: "nieuchwytność" },
      ]);
    });
  });

  describe("findUncoveredLegacyTexts", () => {
    it("returns only the texts nothing accounts for", () => {
      const doc = {
        requirements: ["Siła 3", "Lekka zbroja"],
        structuredRequirements: [{ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 }],
      };
      expect(findUncoveredLegacyTexts(doc)).toEqual(["Lekka zbroja"]);
    });
  });

  describe("planBackfill", () => {
    it("appends the missing text WITHOUT dropping the existing structured entry", () => {
      // The regression that made Pogromienie invisible: the old plan replaced
      // only when the array was empty, so this record was skipped forever.
      expect(planBackfill(POGROMIENIE)).toEqual([
        { kind: "ranked", group: "characteristics", targetKey: "strength", value: 2 },
        { kind: "rankless", text: "większy fechtunek 2" },
      ]);
    });

    it("builds the whole array for an orphaned record", () => {
      expect(planBackfill({ requirements: ["Nieuchwytność", "Lekka zbroja"] })).toEqual([
        { kind: "rankless", text: "nieuchwytność" },
        { kind: "rankless", text: "lekka zbroja" },
      ]);
    });

    it("returns null when everything is covered, so the script writes nothing", () => {
      expect(planBackfill({
        requirements: ["Lekka zbroja"],
        structuredRequirements: [{ kind: "rankless", text: "lekka zbroja" }],
      })).toBeNull();
    });

    it("is idempotent — a second pass over its own output adds nothing", () => {
      const once = planBackfill(POGROMIENIE);
      expect(planBackfill({ requirements: POGROMIENIE.requirements, structuredRequirements: once })).toBeNull();
    });
  });

  describe("needsBackfill", () => {
    it("covers orphaned and partial records, skips covered and blank ones", () => {
      expect(needsBackfill({ requirements: ["Lekka zbroja"] })).toBe(true);
      expect(needsBackfill(POGROMIENIE)).toBe(true);
      expect(needsBackfill({ requirements: ["  "] })).toBe(false);
      expect(needsBackfill({
        requirements: ["Lekka zbroja"],
        structuredRequirements: [{ kind: "rankless", text: "lekka zbroja" }],
      })).toBe(false);
    });
  });

  describe("auditRankedMappings", () => {
    it("catches the Pogromienie mis-mapping (fechtunek stored as strength)", () => {
      const findings = auditRankedMappings(POGROMIENIE);

      expect(findings).toHaveLength(1);
      expect(findings[0].reason).toBe("target-differs");
      expect(findings[0].stored).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 2 });
      expect(findings[0].suggested).toEqual({ kind: "ranked", group: "attributes", targetKey: "fencing", value: 2 });
    });

    it("keeps reporting the mis-mapping after the backfill added the rankless mirror", () => {
      // A text-driven check would go quiet here — exactly on the records that
      // were just repaired and still hold a wrong `ranked` entry.
      const afterBackfill = { requirements: POGROMIENIE.requirements, structuredRequirements: planBackfill(POGROMIENIE) };

      const findings = auditRankedMappings(afterBackfill);

      expect(findings).toHaveLength(1);
      expect(findings[0].reason).toBe("target-differs");
    });

    it("stays quiet when the stored target is named in the legacy text", () => {
      const doc = {
        requirements: ["Siła 3"],
        structuredRequirements: [{ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 }],
      };
      expect(auditRankedMappings(doc)).toEqual([]);
    });

    it("reports a rank that the legacy text does not support", () => {
      const doc = {
        requirements: ["Siła 3"],
        structuredRequirements: [{ kind: "ranked", group: "characteristics", targetKey: "strength", value: 5 }],
      };

      const findings = auditRankedMappings(doc);

      expect(findings).toHaveLength(1);
      expect(findings[0].reason).toBe("value-differs");
    });

    it("does not flag an unstructured text just because an unrelated ranked entry exists", () => {
      const doc = {
        requirements: ["Lekka zbroja", "Siła 3"],
        structuredRequirements: [
          { kind: "rankless", text: "lekka zbroja" },
          { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 },
        ],
      };
      expect(auditRankedMappings(doc)).toEqual([]);
    });

    it("returns nothing when there is no ranked entry to be wrong about", () => {
      const doc = { requirements: ["Lekka zbroja"], structuredRequirements: [] };
      expect(auditRankedMappings(doc)).toEqual([]);
    });

    it("matches entity-name targets by their stored name", () => {
      const doc = {
        requirements: ["Zapał Wojownika 2"],
        structuredRequirements: [{ kind: "ranked", group: "perks", targetKey: "Zapał Wojownika", value: 2 }],
      };
      expect(auditRankedMappings(doc)).toEqual([]);
    });
  });
});
