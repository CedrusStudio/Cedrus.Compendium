
import { Armor } from '@/domain/characters/equipment/Armor';
import { Equipment } from '@/domain/characters/equipment/Equipment';
import { DefensiveItem, Item } from '@/domain/characters/equipment/Item';
import { Mount } from '@/domain/characters/equipment/Mount';
import { Shield } from '@/domain/characters/equipment/Shield';
import { Style, Weapon } from '@/domain/characters/equipment/Weapon';
import { Prisma } from '@/generated/prisma/client';
import { toEntity } from '@/persistence/mappings/chracterMapping';

export function toEquipment(equipmentPersistenceModel: Prisma.EquipmentModel): Equipment
{
  return {
    weapons: equipmentPersistenceModel.weapons.map(toWeapon),
    armors: equipmentPersistenceModel.armors.map(toArmor),
    shields: equipmentPersistenceModel.shields.map(toShield),
    inventory: equipmentPersistenceModel.inventory.map(toItem),
    mounts: equipmentPersistenceModel.mounts.map(toMount),
  };
}

function toItem(itemPersistenceModel: Prisma.ItemModel): Item
{
  return {
    ...toEntity(itemPersistenceModel),
    description: itemPersistenceModel.description,
  }
};

function toWeapon(weaponPersistenceModel: Prisma.WeaponModel): Weapon
{
  return {
    ...toItem(weaponPersistenceModel),
    style: weaponPersistenceModel.style as Style,
    offense: weaponPersistenceModel.offense,
    damageBonus: weaponPersistenceModel.damageBonus,
    range: weaponPersistenceModel.range,
  }
};

type DefensiveItemPersistenceParams = Prisma.ItemModel & {
  resistance: number,
  dexterityRestriction: number,
  reflexRestriction: number,
  initiativeRestriction: number,
  attributePenalty: number,
  strengthRequirement: number,
};

function toDefenseItem(defenseItemPersistenceModel: DefensiveItemPersistenceParams): DefensiveItem
{
  return {
    ...toItem(defenseItemPersistenceModel),
    resistance: defenseItemPersistenceModel.resistance,
    dexterityRestriction: defenseItemPersistenceModel.dexterityRestriction,
    reflexRestriction: defenseItemPersistenceModel.reflexRestriction,
    initiativeRestriction: defenseItemPersistenceModel.initiativeRestriction,
    attributePenalty: defenseItemPersistenceModel.attributePenalty,
    strengthRequirement: defenseItemPersistenceModel.strengthRequirement,
  };
}

function toArmor(armorPersistenceModel: Prisma.ArmorModel): Armor
{
  return {
    ...toDefenseItem(armorPersistenceModel),

    immunity: armorPersistenceModel.immunity,
    protection: armorPersistenceModel.protection,
  };
};

function toShield(shieldPersistenceModel: Prisma.ShieldModel): Shield
{
  return {
    ...toDefenseItem(shieldPersistenceModel),

    block: shieldPersistenceModel.block,
  };
};

function toMount(mountPersistenceModel: Prisma.MountModel): Mount
{
  return {
    ...toItem(mountPersistenceModel),

    paceSpeed: mountPersistenceModel.paceSpeed,
    gallopSpeed: mountPersistenceModel.gallopSpeed,
    canterSpeed: mountPersistenceModel.canterSpeed,
    horsemanshipBonus: mountPersistenceModel.horsemanshipBonus,
  }
};