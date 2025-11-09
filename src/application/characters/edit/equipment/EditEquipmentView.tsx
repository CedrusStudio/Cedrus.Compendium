"use client";

import { Character } from '@/domain/characters/Character';
import { Accordion } from "@/ui/accordion"
import { Form } from "@/ui/form";
import { equipmentSchema, type EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import EditShieldView from '@/application/characters/edit/equipment/EditShieldView';
import EditWeaponView from '@/application/characters/edit/equipment/EditWeaponView';
import EditArmorView from '@/application/characters/edit/equipment/EditArmorView';
import client from "@/infrastructure/clients/charactersClient";
import EditMountView from '@/application/characters/edit/equipment/EditMountView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import SubmitButton from '@/common/components/form/SubmitButton';
import ItemsView from '@/application/characters/equipment/ItemsView';
import EditInventoryItemView from '@/application/characters/edit/equipment/EditInventoryItemView';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { CreateDefaultWeapon, Weapon } from '@/domain/characters/equipment/Weapon';
import { CreateDefaultArmor, Armor } from '@/domain/characters/equipment/Armor';
import { CreateDefaultShield, Shield } from '@/domain/characters/equipment/Shield';
import { CreateDefaultInventoryItem, Item } from '@/domain/characters/equipment/Item';
import { CreateDefaultMount, Mount } from '@/domain/characters/equipment/Mount';
import { displayedText } from '@/presentation/translations';
import { FORM_IDS } from '@/application/characters/edit/editFormConstants';
import { useCharacterForm } from '@/application/characters/edit/hooks/useCharacterForm';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import SelectableItemWrapper from '@/common/components/import/SelectableItemWrapper';
import { useSearchWeapons } from '@/application/characters/edit/equipment/hooks/useSearchWeapons';
import { useSearchArmors } from '@/application/characters/edit/equipment/hooks/useSearchArmors';
import { useSearchShields } from '@/application/characters/edit/equipment/hooks/useSearchShields';
import { useSearchMounts } from '@/application/characters/edit/equipment/hooks/useSearchMounts';
import { useSearchInventory } from '@/application/characters/edit/equipment/hooks/useSearchInventory';
import WeaponView from '@/application/characters/equipment/WeaponView';
import ArmorView from '@/application/characters/equipment/ArmorView';
import ShieldView from '@/application/characters/equipment/ShieldView';
import MountView from '@/application/characters/equipment/MountView';
import { useState, useEffect, useRef } from 'react';
import ItemAccordion from '@/application/characters/equipment/ItemAccordion';

export default function EditEquipmentView(input: { character: Character })
{
  const { character } = input;

  const { form, handleSubmit, isPending, formId } = useCharacterForm<EquipmentDto>
  ({
    characterId: character.id,
    schema: equipmentSchema,
    defaultValues: character.equipment,
    updateFn: client.updateEquipment,
    formId: FORM_IDS.EQUIPMENT,
  });

  const { watchedArray: weapons, append: appendWeapon } = useWatchedFormArray("weapons", form.control);
  const { watchedArray: armors, append: appendArmor } = useWatchedFormArray("armors", form.control);
  const { watchedArray: shields, append: appendShield } = useWatchedFormArray("shields", form.control);
  const { watchedArray: inventory, append: appendInventory } = useWatchedFormArray("inventory", form.control);
  const { watchedArray: mounts, append: appendMount } = useWatchedFormArray("mounts", form.control);

  const [importedWeaponIds, setImportedWeaponIds] = useState<Set<string>>(new Set());
  const [importedArmorIds, setImportedArmorIds] = useState<Set<string>>(new Set());
  const [importedShieldIds, setImportedShieldIds] = useState<Set<string>>(new Set());
  const [importedInventoryIds, setImportedInventoryIds] = useState<Set<string>>(new Set());
  const [importedMountIds, setImportedMountIds] = useState<Set<string>>(new Set());
  const prevIsPendingRef = useRef(isPending);

  useEffect(() =>
  {
    // Clear imported IDs when submission completes (isPending: true → false)
    if (prevIsPendingRef.current && !isPending)
    {
      setImportedWeaponIds(new Set());
      setImportedArmorIds(new Set());
      setImportedShieldIds(new Set());
      setImportedInventoryIds(new Set());
      setImportedMountIds(new Set());
    }
    prevIsPendingRef.current = isPending;
  }, [isPending]);

  const handleImportWeapons = (importedWeapons: Weapon[]) => 
  {
    importedWeapons.forEach(weapon => 
    {
      appendWeapon
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
    });
    
    setImportedWeaponIds(prev => 
    {
      const newSet = new Set(prev);
      importedWeapons.forEach(weapon => newSet.add(weapon.id));
      return newSet;
    });
  };

  const handleImportArmors = (importedArmors: Armor[]) => 
  {
    importedArmors.forEach(armor => 
    {
      appendArmor
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
    });
    
    setImportedArmorIds(prev => 
    {
      const newSet = new Set(prev);
      importedArmors.forEach(armor => newSet.add(armor.id));
      return newSet;
    });
  };

  const handleImportShields = (importedShields: Shield[]) => 
  {
    importedShields.forEach(shield => 
    {
      appendShield
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
    });
    
    setImportedShieldIds(prev => 
    {
      const newSet = new Set(prev);
      importedShields.forEach(shield => newSet.add(shield.id));
      return newSet;
    });
  };

  const handleImportInventory = (importedItems: Item[]) => 
  {
    importedItems.forEach(item => 
    {
      appendInventory
      ({ 
        id: item.id,
        name: item.name,
        description: item.description,
        tags: [...item.tags]
      });
    });
    
    setImportedInventoryIds(prev => 
    {
      const newSet = new Set(prev);
      importedItems.forEach(item => newSet.add(item.id));
      return newSet;
    });
  };

  const handleImportMounts = (importedMounts: Mount[]) => 
  {
    importedMounts.forEach(mount => 
    {
      appendMount
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
    });
    
    setImportedMountIds(prev => 
    {
      const newSet = new Set(prev);
      importedMounts.forEach(mount => newSet.add(mount.id));
      return newSet;
    });
  };

  const renderWeaponItem = (weapon: Weapon, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(weapon.id)}>
        <ItemAccordion item={weapon}>
          <WeaponView weapon={weapon} />
        </ItemAccordion>
      </SelectableItemWrapper>
    );
  };

  const renderArmorItem = (armor: Armor, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(armor.id)}>
        <ItemAccordion item={armor}>
          <ArmorView armor={armor} />
        </ItemAccordion>
      </SelectableItemWrapper>
    );
  };

  const renderShieldItem = (shield: Shield, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(shield.id)}>
        <ItemAccordion item={shield}>
          <ShieldView shield={shield} />
        </ItemAccordion>
      </SelectableItemWrapper>
    );
  };

  const renderInventoryItem = (item: Item, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(item.id)}>
        <ItemAccordion item={item}>
          <div className="p-4">
            <h4 className="font-semibold">{item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </ItemAccordion>
      </SelectableItemWrapper>
    );
  };

  const renderMountItem = (mount: Mount, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(mount.id)}>
        <ItemAccordion item={mount}>
          <MountView horse={mount} />
        </ItemAccordion>
      </SelectableItemWrapper>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} id={formId} className="space-y-8">

        <Accordion type="single" collapsible className='w-90 sm:w-160 lg:w-full'>

          <ItemsView
            items={weapons}
            label={displayedText.weapons}
            itemViewFactory={(item, index) => <EditWeaponView index={index} weapon={item} isImported={importedWeaponIds.has(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "weapons"> 
              isPending={isPending}
              append={appendWeapon}
              toAdd={CreateDefaultWeapon}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_weapons}
              importDescription={displayedText.select_weapons_to_import}
              notFoundText={displayedText.no_weapons_found}
              onImport={handleImportWeapons}
              isPending={isPending}
              currentItemsIds={weapons.map(weapon => weapon.id)}
              useSearchItems={useSearchWeapons}
              renderItem={renderWeaponItem}
            />
          </ItemsView>

          <ItemsView
            items={armors}
            label={displayedText.armors}
            itemViewFactory={(item, index) => <EditArmorView index={index} armor={item} isImported={importedArmorIds.has(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "armors"> 
              isPending={isPending}
              append={appendArmor}
              toAdd={CreateDefaultArmor}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_armors}
              importDescription={displayedText.select_armors_to_import}
              notFoundText={displayedText.no_armors_found}
              onImport={handleImportArmors}
              isPending={isPending}
              currentItemsIds={armors.map(armor => armor.id)}
              useSearchItems={useSearchArmors}
              renderItem={renderArmorItem}
            />
          </ItemsView>

          <ItemsView
            items={shields}
            label={displayedText.shields}
            itemViewFactory={(item, index) => <EditShieldView index={index} shield={item} isImported={importedShieldIds.has(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "shields"> 
              isPending={isPending}
              append={appendShield}
              toAdd={CreateDefaultShield}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_shields}
              importDescription={displayedText.select_shields_to_import}
              notFoundText={displayedText.no_shields_found}
              onImport={handleImportShields}
              isPending={isPending}
              currentItemsIds={shields.map(shield => shield.id)}
              useSearchItems={useSearchShields}
              renderItem={renderShieldItem}
            />
          </ItemsView>

          <ItemsView
            items={inventory}
            label={displayedText.inventory}
            itemViewFactory={(item, index) => <EditInventoryItemView index={index} inventory={item} isImported={importedInventoryIds.has(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "inventory"> 
              isPending={isPending}
              append={appendInventory}
              toAdd={CreateDefaultInventoryItem}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_inventory}
              importDescription={displayedText.select_inventory_to_import}
              notFoundText={displayedText.no_inventory_found}
              onImport={handleImportInventory}
              isPending={isPending}
              currentItemsIds={inventory.map(item => item.id)}
              useSearchItems={useSearchInventory}
              renderItem={renderInventoryItem}
            />
          </ItemsView>

          <ItemsView
            items={mounts}
            label={displayedText.mounts}
            itemViewFactory={(item, index) => <EditMountView key={index} index={index} mount={item} isImported={importedMountIds.has(item.id)} />}
          >
            <AppendToArrayButton<EquipmentDto, "mounts"> 
              isPending={isPending}
              append={appendMount}
              toAdd={CreateDefaultMount}
            />
            <ImportItemsSheet
              importTitle={displayedText.import_mounts}
              importDescription={displayedText.select_mounts_to_import}
              notFoundText={displayedText.no_mounts_found}
              onImport={handleImportMounts}
              isPending={isPending}
              currentItemsIds={mounts.map(mount => mount.id)}
              useSearchItems={useSearchMounts}
              renderItem={renderMountItem}
            />
          </ItemsView>

        </Accordion>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
};
