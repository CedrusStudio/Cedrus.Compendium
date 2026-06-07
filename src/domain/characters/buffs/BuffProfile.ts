import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";

export type StatisticBuff =
{
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
};

export type CharacteristicsBuff =
{
  strength: StatisticBuff;
  dexterity: StatisticBuff;
  constitution: StatisticBuff;
  mind: StatisticBuff;
  charisma: StatisticBuff;
  spellborn: StatisticBuff;
};

export type AttributesBuff =
{
  fencing: StatisticBuff;
  artifice: StatisticBuff;
  precision: StatisticBuff;
  initiative: StatisticBuff;
  martialArt: StatisticBuff;
  horsemanship: StatisticBuff;
  fortitude: StatisticBuff;
  reflex: StatisticBuff;
  willpower: StatisticBuff;
};

export type HealthBuff =
{
  barrier: number;
  vitality: number;
  toughness: number;
  recoveryLevel: number;
  lethalHealth: number;
  lethalRounds: number;
  bonus: number;
};

export type DefenseBuff =
{
  immunity: number;
  resistance: number;
  protection: number;
  block: number;
  parry: number;
  dodge: number;
  bonus: number;
};

export type DamageOffenseBuff =
{
  amount: number;
  grade: number;
  bonus: number;
};

export type WeaponOffenseBuff = DamageOffenseBuff &
{
  criticalPower: number;
  criticalRange: number;
};

export type OffenseBuff =
{
  leadingWeapon: WeaponOffenseBuff;
  secondaryWeapon: WeaponOffenseBuff;
  damageBonus: DamageOffenseBuff;
  additionalDamageBonus: DamageOffenseBuff;
};

export type BuffProfile = Entity &
{
  description?: string;
  characteristics: CharacteristicsBuff;
  attributes: AttributesBuff;
  health: HealthBuff;
  defense: DefenseBuff;
  offense: OffenseBuff;
};

export const createDefaultStatisticBuff = (): StatisticBuff =>
({
  grade: 0,
  value: 0,
  bonus: 0,
  testBonus: 0,
});

export const createDefaultHealthBuff = (): HealthBuff =>
({
  barrier: 0,
  vitality: 0,
  toughness: 0,
  recoveryLevel: 0,
  lethalHealth: 0,
  lethalRounds: 0,
  bonus: 0,
});

export const createDefaultDefenseBuff = (): DefenseBuff =>
({
  immunity: 0,
  resistance: 0,
  protection: 0,
  block: 0,
  parry: 0,
  dodge: 0,
  bonus: 0,
});

export const createDefaultDamageOffenseBuff = (): DamageOffenseBuff =>
({
  amount: 0,
  grade: 0,
  bonus: 0,
});

export const createDefaultWeaponOffenseBuff = (): WeaponOffenseBuff =>
({
  amount: 0,
  grade: 0,
  bonus: 0,
  criticalPower: 0,
  criticalRange: 0,
});

export const createDefaultBuffProfile = (): BuffProfile =>
({
  id: ulid(),
  name: "Nowy profil wzmocnień",
  description: "Opis profilu wzmocnień",
  characteristics:
  {
    strength: createDefaultStatisticBuff(),
    dexterity: createDefaultStatisticBuff(),
    constitution: createDefaultStatisticBuff(),
    mind: createDefaultStatisticBuff(),
    charisma: createDefaultStatisticBuff(),
    spellborn: createDefaultStatisticBuff(),
  },
  attributes:
  {
    fencing: createDefaultStatisticBuff(),
    artifice: createDefaultStatisticBuff(),
    precision: createDefaultStatisticBuff(),
    initiative: createDefaultStatisticBuff(),
    martialArt: createDefaultStatisticBuff(),
    horsemanship: createDefaultStatisticBuff(),
    fortitude: createDefaultStatisticBuff(),
    reflex: createDefaultStatisticBuff(),
    willpower: createDefaultStatisticBuff(),
  },
  health: createDefaultHealthBuff(),
  defense: createDefaultDefenseBuff(),
  offense:
  {
    leadingWeapon: createDefaultWeaponOffenseBuff(),
    secondaryWeapon: createDefaultWeaponOffenseBuff(),
    damageBonus: createDefaultDamageOffenseBuff(),
    additionalDamageBonus: createDefaultDamageOffenseBuff(),
  },
});