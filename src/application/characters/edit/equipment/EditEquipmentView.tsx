"use client";

import { Character } from '@/domain/characters/Character';
import { Form } from "@/ui/form";
import { equipmentSchema, type EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import EditShieldView from '@/application/characters/edit/equipment/EditShieldView';
import EditWeaponView from '@/application/characters/edit/equipment/EditWeaponView';
import EditArmorView from '@/application/characters/edit/equipment/EditArmorView';
import client from "@/infrastructure/clients/charactersClient";
import EditMountView from '@/application/characters/edit/equipment/EditMountView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import ItemsView from '@/application/characters/equipment/ItemsView';
import EditInventoryItemView from '@/application/characters/edit/equipment/EditInventoryItemView';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { allowedStyles, CreateDefaultWeapon, type Style, Weapon } from '@/domain/characters/equipment/Weapon';
import { CreateDefaultArmor, Armor } from '@/domain/characters/equipment/Armor';
import { CreateDefaultShield, Shield } from '@/domain/characters/equipment/Shield';
import { CreateDefaultInventoryItem, Item } from '@/domain/characters/equipment/Item';
import { CreateDefaultMount, Mount } from '@/domain/characters/equipment/Mount';
import { displayedText } from '@/common/translations';
import { useCharacterForm } from '@/application/characters/edit/hooks/useCharacterForm';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import ImportFromCharacterSheet from '@/common/components/import/ImportFromCharacterSheet';
import SelectableItemWrapper from '@/common/components/import/SelectableItemWrapper';
import { useState } from 'react';
import ArmorViewFields from '@/application/common/equipment/Views/ArmorViewFields';
import MountViewFields from '@/application/common/equipment/Views/MountViewFields';
import ShieldViewFields from '@/application/common/equipment/Views/ShieldViewFields';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';
import InventoryItemViewFields from '@/application/common/equipment/Views/InventoryItemViewFields';
import { createArmorKeysetQuery } from '@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery';
import { createKeysetSearchArmorsKey, createKeysetSearchInventoryKey, createKeysetSearchMountsKey, createKeysetSearchShieldsKey, createKeysetSearchWeaponsKey } from '@/persistence/cacheKeys';
import { createShieldKeysetQuery } from '@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery';
import { createInventoryItemKeysetQuery } from '@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery';
import { createMountKeysetQuery } from '@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery';
import { createWeaponKeysetQuery } from '@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery';
import StyleFilter from '@/common/components/filters/StyleFilter';
import { useDraftRemovableItems } from '@/application/characters/edit/hooks/useDraftRemovableItems';

const cloneWeapon = (weapon: Weapon): Weapon =>
({
  id: weapon.id,
  name: weapon.name,
  description: weapon.description,
  tags: [...weapon.tags],
  style: weapon.style,
  offense: { ...weapon.offense, critical: { ...weapon.offense.critical } },
  damageBonus: { ...weapon.damageBonus },
  range: weapon.range
});

const cloneArmor = (armor: Armor): Armor =>
({
  id: armor.id,
  name: armor.name,
  description: armor.description,
  tags: [...armor.tags],
  resistance: armor.resistance,
  dexterityRestriction: armor.dexterityRestriction,
  reflexRestriction: armor.reflexRestriction,
  initiativeRestriction: armor.initiativeRestriction,
  attributePenalty: armor.attributePenalty,
  strengthRequirement: armor.strengthRequirement,
  immunity: armor.immunity,
  protection: armor.protection
});

const cloneShield = (shield: Shield): Shield =>
({
  id: shield.id,
  name: shield.name,
  description: shield.description,
  tags: [...shield.tags],
  resistance: shield.resistance,
  dexterityRestriction: shield.dexterityRestriction,
  reflexRestriction: shield.reflexRestriction,
  initiativeRestriction: shield.initiativeRestriction,
  attributePenalty: shield.attributePenalty,
  strengthRequirement: shield.strengthRequirement,
  block: shield.block
});

const cloneInventoryItem = (item: Item): Item =>
({
  id: item.id,
  name: item.name,
  description: item.description,
  tags: [...item.tags]
});

const cloneMount = (mount: Mount): Mount =>
({
  id: mount.id,
  name: mount.name,
  description: mount.description,
  tags: [...mount.tags],
  paceSpeed: mount.paceSpeed,
  gallopSpeed: mount.gallopSpeed,
  canterSpeed: mount.canterSpeed,
  horsemanshipBonus: mount.horsemanshipBonus
});

export default function EditEquipmentView(input: { character: Character })
{
  const { character } = input;

  const { form, handleSubmit, isPending, isSuccess, formId } = useCharacterForm<EquipmentDto>
  ({
    characterId: character.id,
    tab: "equipment",
    schema: equipmentSchema,
    defaultValues: character.equipment,
    updateFn: client.updateEquipment,
  });

  const { watchedArray: weapons, append: appendWeapon, remove: removeWeapon } = useWatchedFormArray("weapons", form.control);
  const { watchedArray: armors, append: appendArmor, remove: removeArmor } = useWatchedFormArray("armors", form.control);
  const { watchedArray: shields, append: appendShield, remove: removeShield } = useWatchedFormArray("shields", form.control);
  const { watchedArray: inventory, append: appendInventory, remove: removeInventory } = useWatchedFormArray("inventory", form.control);
  const { watchedArray: mounts, append: appendMount, remove: removeMount } = useWatchedFormArray("mounts", form.control);

  const [weaponStyleFilter, setWeaponStyleFilter] = useState<Style | "All">("All");

  const {
    importedIds: importedWeaponIds,
    registerImportedItems: registerImportedWeapons,
    removedItemIds: removedWeaponIds,
    removedItems: removedWeapons,
    removeItemAtIndex: removeWeaponAtIndex,
    removeItemById: removeWeaponById,
    restoreRemovedItem: restoreRemovedWeapon,
  } = useDraftRemovableItems<Weapon>
  ({
    items: weapons,
    initialItems: character.equipment.weapons,
    isPending,
    isSuccess,
    append: appendWeapon,
    remove: removeWeapon,
    cloneItem: cloneWeapon,
  });

  const {
    importedIds: importedArmorIds,
    registerImportedItems: registerImportedArmors,
    removedItemIds: removedArmorIds,
    removedItems: removedArmors,
    removeItemAtIndex: removeArmorAtIndex,
    removeItemById: removeArmorById,
    restoreRemovedItem: restoreRemovedArmor,
  } = useDraftRemovableItems<Armor>
  ({
    items: armors,
    initialItems: character.equipment.armors,
    isPending,
    isSuccess,
    append: appendArmor,
    remove: removeArmor,
    cloneItem: cloneArmor,
  });

  const {
    importedIds: importedShieldIds,
    registerImportedItems: registerImportedShields,
    removedItemIds: removedShieldIds,
    removedItems: removedShields,
    removeItemAtIndex: removeShieldAtIndex,
    removeItemById: removeShieldById,
    restoreRemovedItem: restoreRemovedShield,
  } = useDraftRemovableItems<Shield>
  ({
    items: shields,
    initialItems: character.equipment.shields,
    isPending,
    isSuccess,
    append: appendShield,
    remove: removeShield,
    cloneItem: cloneShield,
  });

  const {
    importedIds: importedInventoryIds,
    registerImportedItems: registerImportedInventoryItems,
    removedItemIds: removedInventoryIds,
    removedItems: removedInventoryItems,
    removeItemAtIndex: removeInventoryAtIndex,
    removeItemById: removeInventoryById,
    restoreRemovedItem: restoreRemovedInventoryItem,
  } = useDraftRemovableItems<Item>
  ({
    items: inventory,
    initialItems: character.equipment.inventory,
    isPending,
    isSuccess,
    append: appendInventory,
    remove: removeInventory,
    cloneItem: cloneInventoryItem,
  });

  const {
    importedIds: importedMountIds,
    registerImportedItems: registerImportedMounts,
    removedItemIds: removedMountIds,
    removedItems: removedMounts,
    removeItemAtIndex: removeMountAtIndex,
    removeItemById: removeMountById,
    restoreRemovedItem: restoreRemovedMount,
  } = useDraftRemovableItems<Mount>
  ({
    items: mounts,
    initialItems: character.equipment.mounts,
    isPending,
    isSuccess,
    append: appendMount,
    remove: removeMount,
    cloneItem: cloneMount,
  });

  const handleImportWeapons = (importedWeapons: Weapon[]) => registerImportedWeapons(importedWeapons);
  const handleImportArmors = (importedArmors: Armor[]) => registerImportedArmors(importedArmors);
  const handleImportShields = (importedShields: Shield[]) => registerImportedShields(importedShields);
  const handleImportInventory = (importedItems: Item[]) => registerImportedInventoryItems(importedItems);
  const handleImportMounts = (importedMounts: Mount[]) => registerImportedMounts(importedMounts);

  const renderWeaponItem = (weapon: Weapon, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') =>
  {
    return (
      <SelectableItemWrapper key={weapon.id} isSelected={isSelected} onToggle={() => onToggle(weapon.id)} state={itemState}>
        <WeaponViewFields weapon={weapon} />
      </SelectableItemWrapper>
    );
  };

  const renderArmorItem = (armor: Armor, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') =>
  {
    return (
      <SelectableItemWrapper key={armor.id} isSelected={isSelected} onToggle={() => onToggle(armor.id)} state={itemState}>
        <ArmorViewFields armor={armor} />
      </SelectableItemWrapper>
    );
  };

  const renderShieldItem = (shield: Shield, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') =>
  {
    return (
      <SelectableItemWrapper key={shield.id} isSelected={isSelected} onToggle={() => onToggle(shield.id)} state={itemState}>
        <ShieldViewFields shield={shield} />
      </SelectableItemWrapper>
    );
  };

  const renderInventoryItem = (item: Item, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') =>
  {
    return (
      <SelectableItemWrapper key={item.id} isSelected={isSelected} onToggle={() => onToggle(item.id)} state={itemState}>
        <InventoryItemViewFields item={item} />
      </SelectableItemWrapper>
    );
  };

  const renderMountItem = (mount: Mount, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') =>
  {
    return (
      <SelectableItemWrapper key={mount.id} isSelected={isSelected} onToggle={() => onToggle(mount.id)} state={itemState}>
        <MountViewFields mount={mount} />
      </SelectableItemWrapper>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} id={formId} className="space-y-8">

          <ItemsView
            items={weapons}
            label={displayedText.weapons}
            itemViewFactory={(item, index) => <EditWeaponView index={index} weapon={item} isImported={importedWeaponIds.has(item.id)} onRemove={() => removeWeaponAtIndex(index)} />}
            removedItems={removedWeapons}
            removedItemViewFactory={item => <EditWeaponView index={-1} weapon={item} isImported={false} isRemoved={true} onRestore={() => restoreRemovedWeapon(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "weapons">
              isPending={isPending}
              append={appendWeapon}
              toAdd={CreateDefaultWeapon}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_weapons}
              importDescription={displayedText.select_weapons_to_import}
              onImport={handleImportWeapons}
              isPending={isPending}
              currentItemsIds={weapons.map(weapon => weapon.id)}
              removedItemsIds={removedWeaponIds}
              onToggleCurrentItem={removeWeaponById}
              onToggleRemovedItem={restoreRemovedWeapon}
              renderItem={renderWeaponItem}
              renderHeaderContent={({ clearResults }) => (
                <StyleFilter
                  selectedStyle={weaponStyleFilter}
                  onStyleChange={style =>
                  {
                    clearResults();
                    setWeaponStyleFilter(style);
                  }}
                  styles={allowedStyles}
                />
              )}
              createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createKeysetSearchWeaponsKey(searchQuery, cursor, includeTags, pageSize, weaponStyleFilter, excludeTags)
              }
              createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createWeaponKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, weaponStyleFilter)
              }
              entityType="weapons"
            />
            <ImportFromCharacterSheet<Weapon>
              categoryLabel={displayedText.weapons}
              currentCharacterId={character.id}
              currentCharacterName={character.name}
              currentItemsIds={weapons.map(weapon => weapon.id)}
              removedItemsIds={removedWeaponIds}
              onToggleCurrentItem={removeWeaponById}
              onToggleRemovedItem={restoreRemovedWeapon}
              itemsSelector={sourceCharacter => sourceCharacter.equipment.weapons}
              renderItem={renderWeaponItem}
              onImport={handleImportWeapons}
              isPending={isPending}
            />
          </ItemsView>

          <ItemsView
            items={armors}
            label={displayedText.armors}
            itemViewFactory={(item, index) => <EditArmorView index={index} armor={item} isImported={importedArmorIds.has(item.id)} onRemove={() => removeArmorAtIndex(index)} />}
            removedItems={removedArmors}
            removedItemViewFactory={item => <EditArmorView index={-1} armor={item} isImported={false} isRemoved={true} onRestore={() => restoreRemovedArmor(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "armors">
              isPending={isPending}
              append={appendArmor}
              toAdd={CreateDefaultArmor}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_armors}
              importDescription={displayedText.select_armors_to_import}
              onImport={handleImportArmors}
              isPending={isPending}
              currentItemsIds={armors.map(armor => armor.id)}
              removedItemsIds={removedArmorIds}
              onToggleCurrentItem={removeArmorById}
              onToggleRemovedItem={restoreRemovedArmor}
              renderItem={renderArmorItem}
              createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createArmorKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createKeysetSearchArmorsKey(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              entityType="armors"
            />
            <ImportFromCharacterSheet<Armor>
              categoryLabel={displayedText.armors}
              currentCharacterId={character.id}
              currentCharacterName={character.name}
              currentItemsIds={armors.map(armor => armor.id)}
              removedItemsIds={removedArmorIds}
              onToggleCurrentItem={removeArmorById}
              onToggleRemovedItem={restoreRemovedArmor}
              itemsSelector={sourceCharacter => sourceCharacter.equipment.armors}
              renderItem={renderArmorItem}
              onImport={handleImportArmors}
              isPending={isPending}
            />
          </ItemsView>

          <ItemsView
            items={shields}
            label={displayedText.shields}
            itemViewFactory={(item, index) => <EditShieldView index={index} shield={item} isImported={importedShieldIds.has(item.id)} onRemove={() => removeShieldAtIndex(index)} />}
            removedItems={removedShields}
            removedItemViewFactory={item => <EditShieldView index={-1} shield={item} isImported={false} isRemoved={true} onRestore={() => restoreRemovedShield(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "shields">
              isPending={isPending}
              append={appendShield}
              toAdd={CreateDefaultShield}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_shields}
              importDescription={displayedText.select_shields_to_import}
              onImport={handleImportShields}
              isPending={isPending}
              currentItemsIds={shields.map(shield => shield.id)}
              removedItemsIds={removedShieldIds}
              onToggleCurrentItem={removeShieldById}
              onToggleRemovedItem={restoreRemovedShield}
              renderItem={renderShieldItem}
              createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createShieldKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createKeysetSearchShieldsKey(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              entityType="shields"
            />
            <ImportFromCharacterSheet<Shield>
              categoryLabel={displayedText.shields}
              currentCharacterId={character.id}
              currentCharacterName={character.name}
              currentItemsIds={shields.map(shield => shield.id)}
              removedItemsIds={removedShieldIds}
              onToggleCurrentItem={removeShieldById}
              onToggleRemovedItem={restoreRemovedShield}
              itemsSelector={sourceCharacter => sourceCharacter.equipment.shields}
              renderItem={renderShieldItem}
              onImport={handleImportShields}
              isPending={isPending}
            />
          </ItemsView>

          <ItemsView
            items={inventory}
            label={displayedText.inventory}
            itemViewFactory={(item, index) => <EditInventoryItemView index={index} inventory={item} isImported={importedInventoryIds.has(item.id)} onRemove={() => removeInventoryAtIndex(index)} />}
            removedItems={removedInventoryItems}
            removedItemViewFactory={item => <EditInventoryItemView index={-1} inventory={item} isImported={false} isRemoved={true} onRestore={() => restoreRemovedInventoryItem(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "inventory">
              isPending={isPending}
              append={appendInventory}
              toAdd={CreateDefaultInventoryItem}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_inventory}
              importDescription={displayedText.select_inventory_to_import}
              onImport={handleImportInventory}
              isPending={isPending}
              currentItemsIds={inventory.map(item => item.id)}
              removedItemsIds={removedInventoryIds}
              onToggleCurrentItem={removeInventoryById}
              onToggleRemovedItem={restoreRemovedInventoryItem}
              renderItem={renderInventoryItem}
              createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createInventoryItemKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createKeysetSearchInventoryKey(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              entityType="inventory"
            />
            <ImportFromCharacterSheet<Item>
              categoryLabel={displayedText.inventory}
              currentCharacterId={character.id}
              currentCharacterName={character.name}
              currentItemsIds={inventory.map(item => item.id)}
              removedItemsIds={removedInventoryIds}
              onToggleCurrentItem={removeInventoryById}
              onToggleRemovedItem={restoreRemovedInventoryItem}
              itemsSelector={sourceCharacter => sourceCharacter.equipment.inventory}
              renderItem={renderInventoryItem}
              onImport={handleImportInventory}
              isPending={isPending}
            />
          </ItemsView>

          <ItemsView
            items={mounts}
            label={displayedText.mounts}
            itemViewFactory={(item, index) => <EditMountView key={index} index={index} mount={item} isImported={importedMountIds.has(item.id)} onRemove={() => removeMountAtIndex(index)} />}
            removedItems={removedMounts}
            removedItemViewFactory={item => <EditMountView index={-1} mount={item} isImported={false} isRemoved={true} onRestore={() => restoreRemovedMount(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "mounts">
              isPending={isPending}
              append={appendMount}
              toAdd={CreateDefaultMount}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_mounts}
              importDescription={displayedText.select_mounts_to_import}
              onImport={handleImportMounts}
              isPending={isPending}
              currentItemsIds={mounts.map(mount => mount.id)}
              removedItemsIds={removedMountIds}
              onToggleCurrentItem={removeMountById}
              onToggleRemovedItem={restoreRemovedMount}
              renderItem={renderMountItem}
              createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createMountKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
                createKeysetSearchMountsKey(searchQuery, cursor, includeTags, pageSize, excludeTags)
              }
              entityType="mounts"
            />
            <ImportFromCharacterSheet<Mount>
              categoryLabel={displayedText.mounts}
              currentCharacterId={character.id}
              currentCharacterName={character.name}
              currentItemsIds={mounts.map(mount => mount.id)}
              removedItemsIds={removedMountIds}
              onToggleCurrentItem={removeMountById}
              onToggleRemovedItem={restoreRemovedMount}
              itemsSelector={sourceCharacter => sourceCharacter.equipment.mounts}
              renderItem={renderMountItem}
              onImport={handleImportMounts}
              isPending={isPending}
            />
          </ItemsView>
      </form>
    </Form>
  );
};
