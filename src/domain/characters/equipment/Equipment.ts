import { Weapon } from "@/domain/characters/equipment/Weapon";
import { Shield } from "@/domain/characters/equipment/Shield";
import { Armor } from "@/domain/characters/equipment/Armor";
import { Item } from "@/domain/characters/equipment/Item";
import { Mount } from "@/domain/characters/equipment/Mount";

export type Equipment = 
{
  weapons: Weapon[];
  armors: Armor[];
  shields: Shield[];
  inventory: Item[];
  mounts: Mount[];
};

export type EquipmentItemArraysTypes = keyof Equipment;
export type EquipmentItemTypes = `weapons.${number}` | `armors.${number}` | `shields.${number}` | `mounts.${number}` | `inventory.${number}`;

export const pathToWeapons = (index: number): `weapons.${number}` => `weapons.${index}`;
export const pathToArmors = (index: number): `armors.${number}` => `armors.${index}`;
export const pathToShields = (index: number): `shields.${number}` => `shields.${index}`;
export const pathToInventory = (index: number): `inventory.${number}` => `inventory.${index}`;
export const pathToMounts = (index: number): `mounts.${number}` => `mounts.${index}`;

export const pathToWeaponsField = <K extends keyof Weapon>(index: number, field: K): `weapons.${number}.${K}` => `weapons.${index}.${field}`;
export const pathToArmorsField = <K extends keyof Armor>(index: number, field: K): `armors.${number}.${K}` => `armors.${index}.${field}`;
export const pathToShieldsField = <K extends keyof Shield>(index: number, field: K): `shields.${number}.${K}` => `shields.${index}.${field}`;
export const pathToInventoryField = <K extends keyof Item>(index: number, field: K): `inventory.${number}.${K}` => `inventory.${index}.${field}`;
export const pathToMountsField = <K extends keyof Mount>(index: number, field: K): `mounts.${number}.${K}` => `mounts.${index}.${field}`;

export const splitEquipmentItemTypes = (type: EquipmentItemTypes): { name: EquipmentItemArraysTypes; index: number } => 
{
  const parts = type.split('.');
  return {
    name: parts[0] as EquipmentItemArraysTypes,
    index: parseInt(parts[1]),
  };
};