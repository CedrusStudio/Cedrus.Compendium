import type { CombatantSnapshot, AttackKind } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { Offense, WeaponOffense } from "@/domain/characters/combat/Offense";
import type { Defense } from "@/domain/characters/combat/Defense";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import type { Attributes } from "@/domain/characters/statistics/Attributes";
import type { Characteristics } from "@/domain/characters/statistics/Characteristics";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";

const zeroStat = (grade = 3): Statistic => ({ grade, value: 0, bonus: 0, testBonus: 0 });
export const makeAttributes = (over: Partial<Attributes> = {}): Attributes => ({
  fencing: zeroStat(), artifice: zeroStat(), precision: zeroStat(), initiative: zeroStat(),
  martialArt: zeroStat(), horsemanship: zeroStat(), fortitude: zeroStat(), reflex: zeroStat(), willpower: zeroStat(), ...over,
});
export const makeCharacteristics = (over: Partial<Characteristics> = {}): Characteristics => ({
  strength: zeroStat(), dexterity: zeroStat(), constitution: zeroStat(), mind: zeroStat(), charisma: zeroStat(), spellborn: zeroStat(), ...over,
});

const weapon = (amount: number, grade: number, bonus = 0): WeaponOffense => ({
  amount,
  grade,
  bonus,
  isPhantom: false,
  critical: { power: 0, range: 0 },
});

export function makeOffense(id: string, amount: number, grade: number, bonus = 0): Offense {
  return {
    id,
    name: `offense-${id}`,
    leadingWeapon: weapon(amount, grade, bonus),
    secondaryWeapon: undefined,
    damageBonus: { amount: 0, grade: 0, bonus: 0, isPhantom: false },
    additionalDamageBonus: undefined,
  };
}

export function makeDefense(id: string, overrides: Partial<Defense> = {}): Defense {
  return {
    id,
    name: `defense-${id}`,
    immunity: 0,
    resistance: 0,
    protection: 0,
    block: 0,
    parry: 0,
    dodge: 0,
    bonus: 0,
    ...overrides,
  };
}

const stat = (value: number, grade = 3): Statistic => ({ grade, value, bonus: 0, testBonus: 0 });

export function makeSnapshot(
  id: string,
  opts: {
    maxHp?: number;
    offense?: Offense;
    defense?: Defense;
    maneuvers?: ManeuverDefinition[];
    initiativeValue?: number;
    lethalHealth?: number;
    lethalRounds?: number;
    barrier?: number;
    precisionValue?: number;
    reflexValue?: number;
    attackKind?: AttackKind;
    buffProfiles?: BuffProfile[];
    attributes?: Partial<Attributes>;
    characteristics?: Partial<Characteristics>;
  } = {},
): CombatantSnapshot {
  const offense = opts.offense ?? makeOffense(`${id}-off`, 2, 5, 2);
  const defense = opts.defense ?? makeDefense(`${id}-def`);
  return {
    id,
    name: id,
    maxHp: opts.maxHp ?? 40,
    barrier: opts.barrier ?? 0,
    lethalRounds: opts.lethalRounds ?? 0,
    lethalHealth: opts.lethalHealth ?? 0,
    defenses: [defense],
    defaultDefenseId: defense.id,
    offenses: [offense],
    defaultOffenseId: offense.id,
    maneuvers: opts.maneuvers ?? [],
    spells: [],
    initiative: stat(opts.initiativeValue ?? 0),
    precision: stat(opts.precisionValue ?? 0),
    reflex: stat(opts.reflexValue ?? 0),
    skills: {
      attributes: makeAttributes(opts.attributes),
      characteristics: makeCharacteristics(opts.characteristics),
    },
    attackKind: opts.attackKind ?? "melee",
    buffProfiles: opts.buffProfiles ?? [],
  };
}
