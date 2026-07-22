import { describe, it, expect } from "vitest";
import { toCombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { CreateEmptyCharacter } from "@/domain/characters/Character";
import { createDefaultBuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { CreateDefaultSpell, type Power, type PowerSpecification } from "@/domain/characters/combat/Power";

function baseCharacter() {
  return CreateEmptyCharacter({ name: "Test", shortName: "T", tags: [], description: "" });
}

function spellPower(): { power: Power; spec: PowerSpecification } {
  const spell = { ...CreateDefaultSpell(), id: "sp1", name: "Ognik" };
  const power: Power = { id: "pw1", name: "Piromant", type: "moc", level: 2, bonus: 0, essence: 1, description: "", powerSpecificationId: "spec1", spells: [spell] };
  const spec: PowerSpecification = {
    id: "spec1", name: "Piromancja", description: "", tags: [],
    offenses: [{
      spellOffense: { amount: 0, grade: 0, bonus: 0, isPhantom: false, critical: { power: 0, range: 0 } },
      spellDamage: { amount: 0, grade: 0, bonus: 7, isPhantom: false },
      description: "", cost: 0,
    }],
  };
  return { power, spec };
}

describe("toCombatantSnapshot — spells", () => {
  it("resolves spells from the injected PowerSpecification", () => {
    const { power, spec } = spellPower();
    const snap = toCombatantSnapshot({ ...baseCharacter(), powers: [power] }, { powerSpecifications: { spec1: spec } });
    expect(snap.spells).toHaveLength(1);
    expect(snap.spells[0]!.name).toBe("Ognik");
    expect(snap.spells[0]!.offense.damageBonus.bonus).toBe(7);
    expect(snap.spells[0]!.costEssence).toBe(20); // fixed default cost
  });

  it("has no spells when specifications are not provided", () => {
    const { power } = spellPower();
    expect(toCombatantSnapshot({ ...baseCharacter(), powers: [power] }).spells).toHaveLength(0);
  });
});

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
