import { Armor } from '@/domain/characters/equipment/Armor';
import { Equipment } from '@/domain/characters/equipment/Equipment';
import { DefensiveItem, Item } from '@/domain/characters/equipment/Item';
import { Mount } from '@/domain/characters/equipment/Mount';
import { Shield } from '@/domain/characters/equipment/Shield';
import { Style, Weapon } from '@/domain/characters/equipment/Weapon';
import { Prisma } from '@prisma/client';
import { toEntity } from '@/persistence/mappings/entityMapping';

type WeaponModel = Prisma.WeaponGetPayload<null>;
type ArmorModel = Prisma.ArmorGetPayload<null>;
type ShieldModel = Prisma.ShieldGetPayload<null>;
type ItemModel = Prisma.InventoryItemGetPayload<null>;
type MountModel = Prisma.MountGetPayload<null>;

export function toEquipment
(
  weapons: WeaponModel[],
  armors: ArmorModel[],
  shields: ShieldModel[],
  inventory: ItemModel[],
  mounts: MountModel[]
)
  : Equipment
{
  return {
    weapons: weapons.map(toWeapon),
    armors: armors.map(toArmor),
    shields: shields.map(toShield),
    inventory: inventory.map(toItem),
    mounts: mounts.map(toMount),
  };
}

function toItem(itemPersistenceModel: ItemModel): Item
{
  return {
    ...toEntity(itemPersistenceModel),
    description: itemPersistenceModel.description,
    tags: itemPersistenceModel.tags ?? []
  }
};

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

function toArmor(armorPersistenceModel: ArmorModel): Armor
{
  return {
    ...toDefenseItem(armorPersistenceModel),

    immunity: armorPersistenceModel.immunity,
    protection: armorPersistenceModel.protection,
  };
};

function toShield(shieldPersistenceModel: ShieldModel): Shield
{
  return {
    ...toDefenseItem(shieldPersistenceModel),

    block: shieldPersistenceModel.block,
  };
};

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