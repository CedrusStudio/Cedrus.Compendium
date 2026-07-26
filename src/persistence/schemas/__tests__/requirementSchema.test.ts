import { describe, expect, it } from "vitest";
import { requirementSchema, requirementsSchema } from "@/persistence/schemas/requirementSchema";

describe("requirementSchema", () => {
  describe("valid payloads", () => {
    it("parses a rankless requirement", () => {
      const result = requirementSchema.safeParse({ kind: "rankless", text: "musi umieć pływać" });
      expect(result.success).toBe(true);
    });

    it("parses a ranked statistic requirement", () => {
      const result = requirementSchema.safeParse({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 });
      expect(result.success).toBe(true);
    });

    it("parses a ranked entity requirement", () => {
      const result = requirementSchema.safeParse({ kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 });
      expect(result.success).toBe(true);
    });

    it("accepts a negative required value", () => {
      const result = requirementSchema.safeParse({ kind: "ranked", group: "attributes", targetKey: "fencing", value: -1 });
      expect(result.success).toBe(true);
    });

    it("parses an array of mixed requirements", () => {
      const result = requirementsSchema.safeParse([
        { kind: "rankless", text: "cokolwiek" },
        { kind: "ranked", group: "spells", targetKey: "Kula Ognia", value: 1 },
      ]);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid payloads", () => {
    it("rejects an unknown discriminator", () => {
      expect(requirementSchema.safeParse({ kind: "mystery", text: "x" }).success).toBe(false);
    });

    it("rejects an empty rankless text", () => {
      expect(requirementSchema.safeParse({ kind: "rankless", text: "" }).success).toBe(false);
    });

    it("rejects a ranked requirement with an unknown group", () => {
      expect(requirementSchema.safeParse({ kind: "ranked", group: "weapons", targetKey: "x", value: 1 }).success).toBe(false);
    });

    it("rejects a ranked requirement with a non-integer value", () => {
      expect(requirementSchema.safeParse({ kind: "ranked", group: "characteristics", targetKey: "strength", value: 1.5 }).success).toBe(false);
    });

    it("rejects a ranked requirement missing targetKey", () => {
      expect(requirementSchema.safeParse({ kind: "ranked", group: "characteristics", value: 1 }).success).toBe(false);
    });

    it("rejects a ranked requirement with an empty targetKey", () => {
      expect(requirementSchema.safeParse({ kind: "ranked", group: "characteristics", targetKey: "", value: 1 }).success).toBe(false);
    });
  });
});
