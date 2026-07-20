import { describe, it, expect } from "vitest";
import { toCombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { CreateEmptyCharacter } from "@/domain/characters/Character";
import { createDefaultBuffProfile } from "@/domain/characters/buffs/BuffProfile";

function baseCharacter() {
  return CreateEmptyCharacter({ name: "Test", shortName: "T", tags: [], description: "" });
}

function vitalityBuff(id: string, vitality: number) {
  const profile = createDefaultBuffProfile();
  return { ...profile, id, health: { ...profile.health, vitality } };
}

describe("toCombatantSnapshot — per-simulation buffs (point 6)", () => {
  it("defaults attackKind to melee and applies no buffs when none active", () => {
    const snapshot = toCombatantSnapshot(baseCharacter());
    expect(snapshot.attackKind).toBe("melee");
  });

  it("does not apply an inactive buff profile", () => {
    const base = baseCharacter();
    const baseHp = toCombatantSnapshot(base).maxHp;
    const withProfile = { ...base, buffProfiles: [vitalityBuff("p1", 10)] };
    expect(toCombatantSnapshot(withProfile).maxHp).toBe(baseHp);
  });

  it("applies a character's own profile when activated via override", () => {
    const base = baseCharacter();
    const baseHp = toCombatantSnapshot(base).maxHp;
    const withProfile = { ...base, buffProfiles: [vitalityBuff("p1", 10)] };
    const snapshot = toCombatantSnapshot(withProfile, { overrideActiveBuffProfileIds: ["p1"] });
    expect(snapshot.maxHp).toBe(baseHp + 10);
  });

  it("applies extra temporary profiles on top", () => {
    const base = baseCharacter();
    const baseHp = toCombatantSnapshot(base).maxHp;
    const snapshot = toCombatantSnapshot(base, { extraBuffProfiles: [vitalityBuff("temp", 15)] });
    expect(snapshot.maxHp).toBe(baseHp + 15);
  });

  it("stacks override + extra profiles", () => {
    const base = baseCharacter();
    const baseHp = toCombatantSnapshot(base).maxHp;
    const withProfile = { ...base, buffProfiles: [vitalityBuff("p1", 10)] };
    const snapshot = toCombatantSnapshot(withProfile, {
      overrideActiveBuffProfileIds: ["p1"],
      extraBuffProfiles: [vitalityBuff("temp", 5)],
    });
    expect(snapshot.maxHp).toBe(baseHp + 15);
  });

  it("honors an explicit attackKind (ranged)", () => {
    const snapshot = toCombatantSnapshot(baseCharacter(), { attackKind: "rangedPhysical" });
    expect(snapshot.attackKind).toBe("rangedPhysical");
  });
});
