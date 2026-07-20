/**
 * Two hand-built combatant snapshots for demoing the engine + replay without a
 * persistence layer yet. NOT test fixtures — these live in the app so the demo
 * route can render a real, deterministic fight.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { Offense, WeaponOffense } from "@/domain/characters/combat/Offense";
import type { Defense } from "@/domain/characters/combat/Defense";

const weapon = (amount: number, grade: number, bonus: number, critRange = 0, critPower = 0): WeaponOffense => ({
  amount,
  grade,
  bonus,
  isPhantom: false,
  critical: { power: critPower, range: critRange },
});

const offense = (id: string, w: WeaponOffense): Offense => ({
  id,
  name: id,
  leadingWeapon: w,
  secondaryWeapon: undefined,
  damageBonus: { amount: 0, grade: 0, bonus: 0, isPhantom: false },
  additionalDamageBonus: undefined,
});

const defense = (id: string, over: Partial<Defense>): Defense => ({
  id,
  name: id,
  immunity: 0,
  resistance: 0,
  protection: 0,
  block: 0,
  parry: 0,
  dodge: 0,
  bonus: 0,
  ...over,
});

const shieldBashDef: ManeuverDefinition = {
  id: "demo-shield-bash",
  name: "Shield Bash",
  grade: 1,
  description: "",
  requirements: [],
  price: 1,
  tags: [],
  castTime: "Standardowa",
  cooldown: 2,
  cost: { castTime: "Standardowa" },
  hardRequirements: [{ kind: "shield" }],
  effects: [
    { type: "damage", damage: { amount: 0, grade: 0, bonus: 6 }, damageType: "zwyczajne" },
    { type: "chance", chance: 40, then: [{ type: "status", status: "stagger", duration: 1 }] },
  ],
};

const rendDef: ManeuverDefinition = {
  id: "demo-rend",
  name: "Rozcięcie",
  grade: 1,
  description: "",
  requirements: [],
  price: 1,
  tags: [],
  castTime: "Standardowa",
  cooldown: 3,
  cost: { castTime: "Standardowa" },
  hardRequirements: [],
  effects: [
    { type: "damage", damage: { amount: 1, grade: 4, bonus: 2 }, damageType: "zwyczajne" },
    {
      type: "status",
      status: "bleeding",
      duration: 3,
      tick: { damage: { amount: 0, grade: 0, bonus: 4 }, damageType: "śmiertelne" },
    },
  ],
};

export const sampleKnight: CombatantSnapshot = {
  id: "knight",
  name: "Rycerz",
  maxHp: 55,
  barrier: 6,
  lethalRounds: 0,
  lethalHealth: 0,
  defenses: [defense("knight-def", { block: 4, protection: 3 })],
  defaultDefenseId: "knight-def",
  offenses: [offense("knight-off", weapon(2, 6, 3, 2, 4))],
  defaultOffenseId: "knight-off",
  maneuvers: [shieldBashDef],
  initiative: { grade: 3, value: 2, bonus: 0, testBonus: 0 },
  precision: { grade: 3, value: 1, bonus: 0, testBonus: 0 },
  reflex: { grade: 3, value: 3, bonus: 0, testBonus: 0 },
  attackKind: "melee",
  buffProfiles: [],
};

export const sampleAssassin: CombatantSnapshot = {
  id: "assassin",
  name: "Skrytobójca",
  maxHp: 42,
  barrier: 0,
  lethalRounds: 0,
  lethalHealth: 0,
  defenses: [defense("assassin-def", { dodge: 5, parry: 2 })],
  defaultDefenseId: "assassin-def",
  offenses: [offense("assassin-off", weapon(2, 5, 2, 4, 6))],
  defaultOffenseId: "assassin-off",
  maneuvers: [rendDef],
  initiative: { grade: 4, value: 4, bonus: 0, testBonus: 0 },
  precision: { grade: 4, value: 3, bonus: 0, testBonus: 0 },
  reflex: { grade: 4, value: 4, bonus: 0, testBonus: 0 },
  attackKind: "melee",
  buffProfiles: [],
};
