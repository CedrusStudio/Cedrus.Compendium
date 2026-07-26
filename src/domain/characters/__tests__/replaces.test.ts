import { describe, expect, it } from "vitest";
import { replacedEntityName } from "@/domain/characters/replaces";

describe("replacedEntityName", () => {
  it("pulls the replaced entity out of the authored wording", () => {
    // All six occurrences in the library name a real Maneuver.
    expect(replacedEntityName("Zastępuje Młyniec")).toBe("Młyniec");
    expect(replacedEntityName("Zastępuje Zapał Wojownika")).toBe("Zapał Wojownika");
    expect(replacedEntityName("zastępuje finte 3")).toBe("finte 3");
  });

  it("tolerates the unaccented spelling", () => {
    expect(replacedEntityName("Zastepuje Antyzapał")).toBe("Antyzapał");
  });

  it("ignores anything that is not a replacement note", () => {
    expect(replacedEntityName("Lekka zbroja")).toBeUndefined();
    expect(replacedEntityName("Siła 3")).toBeUndefined();
  });

  it("ignores the word on its own", () => {
    expect(replacedEntityName("zastępuje   ")).toBeUndefined();
  });
});
