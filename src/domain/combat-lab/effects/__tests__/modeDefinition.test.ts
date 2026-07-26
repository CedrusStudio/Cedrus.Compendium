import { describe, it, expect } from "vitest";
import { toModeDefinition, groupModeFamilies, variantEffectsAt } from "@/domain/combat-lab/effects/ModeDefinition";
import type { Mode } from "@/domain/characters/combat/Mode";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

const stat = (protection: number): Effect => ({ type: "stat", mode: "self", duration: 1, protection });

function mode(name: string, grade: number, over: Partial<Mode> = {}): Mode
{
  return { id: `${name}-${grade}`, name, grade, description: "", price: 0, tags: [], ...over };
}

describe("mode definitions (stance/state families)", () =>
{
  it("lifts effects, and drops them when simulatable === false", () =>
  {
    expect(toModeDefinition(mode("A", 1, { effects: [stat(2)] })).effects).toHaveLength(1);
    expect(toModeDefinition(mode("A", 1, { effects: [stat(2)], simulatable: false })).effects).toHaveLength(0);
    expect(toModeDefinition(mode("A", 1)).effects).toHaveLength(0); // unauthored → inert
  });

  it("groups records of one name into a rank family keyed by grade", () =>
  {
    const families = groupModeFamilies([
      mode("Ciężka Tarcza", 1, { effects: [stat(1)] }),
      mode("Ciężka Tarcza", 2, { effects: [stat(2)] }),
      mode("Ciężka Tarcza", 3, { effects: [stat(3)] }),
      mode("Inna", 1, { effects: [stat(9)] }),
    ]);
    expect(families).toHaveLength(2);
    const tarcza = families.find(f => f.name === "Ciężka Tarcza")!;
    expect(tarcza.grades).toEqual([1, 2, 3]);
    expect((tarcza.variantsByGrade[2]![0] as { protection: number }).protection).toBe(2);
  });

  it("variantEffectsAt returns the exact grade, else clamps to the ladder", () =>
  {
    const [family] = groupModeFamilies([
      mode("S", 1, { effects: [stat(1)] }),
      mode("S", 3, { effects: [stat(3)] }),
    ]);
    expect((variantEffectsAt(family!, 3)[0] as { protection: number }).protection).toBe(3);
    // grade 2 not authored → highest ≤ 2 is grade 1.
    expect((variantEffectsAt(family!, 2)[0] as { protection: number }).protection).toBe(1);
    // rank-up past the top → clamp to grade 3.
    expect((variantEffectsAt(family!, 5)[0] as { protection: number }).protection).toBe(3);
  });
});
