
import { Armor } from '@/domain/characters/equipment/Armor';
import { Equipment } from '@/domain/characters/equipment/Equipment';
import { DefensiveItem, Item } from '@/domain/characters/equipment/Item';
import { Mount } from '@/domain/characters/equipment/Mount';
import { Shield } from '@/domain/characters/equipment/Shield';
import { Style, Weapon } from '@/domain/characters/equipment/Weapon';
import { Prisma } from '@prisma/client';
import { toEntity } from '@/persistence/mappings/entityMapping';

type EquipmentModel = Prisma.CharacterGetPayload<{select: { equipment: true }}>['equipment'];

export function toEquipment(equipmentPersistenceModel: EquipmentModel): Equipment
{
  return {
    weapons: equipmentPersistenceModel.weapons.map(toWeapon),
    armors: equipmentPersistenceModel.armors.map(toArmor),
    shields: equipmentPersistenceModel.shields.map(toShield),
    inventory: equipmentPersistenceModel.inventory.map(toItem),
    mounts: equipmentPersistenceModel.mounts.map(toMount),
  };
}

type ItemModel = Prisma.CharacterGetPayload<{select: { equipment: true }}>['equipment']['inventory'][number];

function toItem(itemPersistenceModel: ItemModel): Item
{
  return {
    ...toEntity(itemPersistenceModel),
    description: itemPersistenceModel.description,
    tags: itemPersistenceModel.tags
  }
};

type WeaponModel = Prisma.CharacterGetPayload<{select: { equipment: true }}>['equipment']['weapons'][number];

function toWeapon(weaponPersistenceModel: WeaponModel): Weapon
{
  return {
    ...toItem(weaponPersistenceModel),
    style: weaponPersistenceModel.style as Style,
    offense: weaponPersistenceModel.offense,
    damageBonus: weaponPersistenceModel.damageBonus,
    range: weaponPersistenceModel.range,
  }
};

type DefensiveItemPersistenceParams = ItemModel & {
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

type ArmorModel = Prisma.CharacterGetPayload<{select: { equipment: true }}>['equipment']['armors'][number];

function toArmor(armorPersistenceModel: ArmorModel): Armor
{
  return {
    ...toDefenseItem(armorPersistenceModel),

    immunity: armorPersistenceModel.immunity,
    protection: armorPersistenceModel.protection,
  };
};

type ShieldModel = Prisma.CharacterGetPayload<{select: { equipment: true }}>['equipment']['shields'][number];

function toShield(shieldPersistenceModel: ShieldModel): Shield
{
  return {
    ...toDefenseItem(shieldPersistenceModel),

    block: shieldPersistenceModel.block,
  };
};

type MountModel = Prisma.CharacterGetPayload<{select: { equipment: true }}>['equipment']['mounts'][number];

function toMount(mountPersistenceModel: MountModel): Mount
{
  return {
    ...toItem(mountPersistenceModel),

    paceSpeed: mountPersistenceModel.paceSpeed,
    gallopSpeed: mountPersistenceModel.gallopSpeed,
    canterSpeed: mountPersistenceModel.canterSpeed,
    horsemanshipBonus: mountPersistenceModel.horsemanshipBonus,
  }
};