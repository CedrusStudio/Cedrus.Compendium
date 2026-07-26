import { describe, expect, it } from "vitest";
import type { Requirement } from "@/domain/requirements/Requirement";
import {
  buildRequirementForType,
  defaultDraftCache,
  firstSkillKey,
  skillKeysForGroup,
  typeOfRequirement,
  updateCache,
} from "@/application/common/requirements/requirementPickerModel";

describe("requirementPickerModel", () => {
  describe("typeOfRequirement", () => {
    it("maps rankless to 'text'", () => {
      expect(typeOfRequirement({ kind: "rankless", text: "x" })).toBe("text");
    });

    it("maps ranked to its group", () => {
      expect(typeOfRequirement({ kind: "ranked", group: "maneuvers", targetKey: "Cios", value: 2 })).toBe("maneuvers");
    });
  });

  describe("skill helpers", () => {
    it("lists only the keys for a statistic group", () => {
      expect(skillKeysForGroup("characteristics")).toContain("strength");
      expect(skillKeysForGroup("characteristics")).not.toContain("fencing");
      expect(firstSkillKey("attributes")).toBe("fencing");
    });
  });

  describe("buildRequirementForType — data preservation", () => {
    it("restores cached free text when switching back to 'text'", () => {
      let cache = defaultDraftCache();
      cache = updateCache(cache, { kind: "rankless", text: "Zapał Wojownika" });
      cache = updateCache(cache, { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 });

      const back = buildRequirementForType("text", cache);
      expect(back).toEqual({ kind: "rankless", text: "Zapał Wojownika" });
    });

    it("restores cached ranked data (group/key/value) when switching back", () => {
      let cache = defaultDraftCache();
      cache = updateCache(cache, { kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 4 });
      cache = updateCache(cache, { kind: "rankless", text: "temp" });

      const back = buildRequirementForType("maneuvers", cache);
      expect(back).toEqual({ kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 4 });
    });

    it("keeps the value but resets the stat key when switching between statistic groups", () => {
      let cache = defaultDraftCache();
      cache = updateCache(cache, { kind: "ranked", group: "characteristics", targetKey: "strength", value: 5 });

      const asAttribute = buildRequirementForType("attributes", cache);
      expect(asAttribute).toEqual({ kind: "ranked", group: "attributes", targetKey: "fencing", value: 5 });
    });

    it("preserves the free-text name across entity groups", () => {
      let cache = defaultDraftCache();
      cache = updateCache(cache, { kind: "ranked", group: "maneuvers", targetKey: "Cios", value: 2 });

      const asStance = buildRequirementForType("stances", cache);
      expect(asStance).toEqual({ kind: "ranked", group: "stances", targetKey: "Cios", value: 2 });
    });

    it("clears the target when moving from a statistic group to an entity group", () => {
      let cache = defaultDraftCache();
      cache = updateCache(cache, { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 });

      const asSpell = buildRequirementForType("spells", cache) as Extract<Requirement, { kind: "ranked" }>;
      expect(asSpell.group).toBe("spells");
      expect(asSpell.targetKey).toBe("");
      expect(asSpell.value).toBe(3);
    });

    it("defaults a fresh statistic pick to the group's first skill", () => {
      const fresh = buildRequirementForType("characteristics", defaultDraftCache());
      expect(fresh).toEqual({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 0 });
    });
  });
});
