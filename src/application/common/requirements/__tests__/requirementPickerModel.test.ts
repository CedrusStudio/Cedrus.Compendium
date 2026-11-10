import { describe, expect, it } from "vitest";
import type { Requirement } from "@/domain/requirements/Requirement";
import {
  buildRequirementForType,
  defaultDraftCache,
  defaultTargetKeyForGroup,
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

describe("draft restoration for composite and special targets", () => {
  it.each([
    ["characteristics", "strength"], ["powers", "moc"], ["derived", "spellStrength"],
    ["equipment", "armor.lekka"], ["spells", ""],
  ] as const)("suggests a valid fresh target for %s", (group, key) => {
    expect(defaultTargetKeyForGroup(group)).toBe(key);
  });

  it("restores an edited alternative, sum and count independently", () => {
    const a: Requirement = { kind: "anyOf", options: [
      { kind: "rankless", text: "Zgoda dowódcy" },
      { kind: "ranked", group: "powers", targetKey: "wiez", value: 2 },
    ] };
    const s: Requirement = { kind: "sum", targets: [
      { group: "characteristics", targetKey: "strength" }, { group: "attributes", targetKey: "fencing" },
    ], value: 7 };
    const c: Requirement = { kind: "count", groups: ["spells", "perks"], tag: "lód", minGrade: 0, value: 3 };
    const cache = [a, s, c].reduce(updateCache, defaultDraftCache());
    for (const requirement of [a, s, c]) expect(buildRequirementForType(typeOfRequirement(requirement), cache)).toEqual(requirement);
  });

  it("recovers valid defaults from incomplete older composite drafts", () => {
    const cache = { ...defaultDraftCache(), anyOfOptions: [], sum: { targets: [], value: 4 }, count: { groups: [], value: 2 } };
    expect(buildRequirementForType("anyOf", cache)).toEqual({ kind: "anyOf", options: [
      { kind: "ranked", group: "powers", targetKey: "moc", value: 1 },
      { kind: "ranked", group: "powers", targetKey: "wiez", value: 1 },
    ] });
    expect(buildRequirementForType("sum", cache)).toEqual({ kind: "sum", targets: [
      { group: "characteristics", targetKey: "mind" }, { group: "characteristics", targetKey: "dexterity" },
    ], value: 4 });
    expect(buildRequirementForType("count", cache)).toEqual({ kind: "count", groups: ["maneuvers"], value: 2 });
  });

  it.each([
    ["powers", "wiez", "wiez"], ["powers", "unknown", "moc"],
    ["derived", "parry", "parry"], ["derived", "unknown", "spellStrength"],
    ["equipment", "shield", "shield"], ["equipment", "unknown", "armor.lekka"],
    ["attributes", "precision", "precision"], ["attributes", "strength", "fencing"],
  ] as const)("retains only a valid target for %s (%s)", (group, oldKey, targetKey) => {
    const cache = updateCache(defaultDraftCache(), { kind: "ranked", group, targetKey: oldKey, value: 4 });
    expect(buildRequirementForType(group, cache)).toEqual({ kind: "ranked", group, targetKey, value: 4 });
    if (group !== "attributes") {
      expect(buildRequirementForType("spells", cache)).toEqual({ kind: "ranked", group: "spells", targetKey: "", value: 4 });
    }
  });
});
