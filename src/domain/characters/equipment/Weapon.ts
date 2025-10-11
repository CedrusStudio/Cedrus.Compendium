import { Item } from "@/domain/characters/equipment/Item";
import { Critical, DamageOffense, WeaponOffense } from "@/domain/characters/combat/Offense";
import { pathToWeaponsField } from "@/domain/characters/equipment/Equipment";

export type Weapon = Item & 
{
  style: Style;
  offense: WeaponOffense;
  damageBonus: DamageOffense;
  range: number;
};

export type Style = "None" | "Jednoręczny" | "Dwuręczny" | "Dystansowy" | "Rzucony" | "Półtoraręczny";
export const allowedStyles = ["None", "Jednoręczny", "Dwuręczny", "Dystansowy", "Rzucony", "Półtoraręczny"] as const satisfies readonly Style[];

export const pathToWeaponsWeaponOffenseField = <K extends keyof WeaponOffense>(index: number, field: K): `weapons.${number}.offense.${K}` => `${pathToWeaponsField(index, 'offense')}.${field}`;
export const pathToWeaponsWeaponOffenseCriticalField = <K extends keyof Critical>(index: number, field: K): `weapons.${number}.offense.critical.${K}` => `${pathToWeaponsField(index, 'offense')}.critical.${field}`;
export const pathToWeaponsDamageOffenseField = <K extends keyof DamageOffense>(index: number, field: K): `weapons.${number}.damageBonus.${K}` => `${pathToWeaponsField(index, 'damageBonus')}.${field}`;