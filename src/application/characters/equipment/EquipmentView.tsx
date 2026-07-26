"use client";

import { useMemo, useState } from 'react';
import { Equipment } from '@/domain/characters/equipment/Equipment';
import { Item } from '@/domain/characters/equipment/Item';
import ItemsView from '@/application/characters/equipment/ItemsView';
import { displayedText } from '@/common/translations';
import { Input } from '@/common/components/ui/input';
import InventoryItemViewFields from '@/application/common/equipment/Views/InventoryItemViewFields';
import MountViewFields from '@/application/common/equipment/Views/MountViewFields';
import ArmorViewFields from '@/application/common/equipment/Views/ArmorViewFields';
import ShieldViewFields from '@/application/common/equipment/Views/ShieldViewFields';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';

export default function EquipmentView({ equipment }: { equipment: Equipment })
{
  const [query, setQuery] = useState('');

  // Client-side, instant filtering over the already-loaded equipment — no refetch.
  // Matches item name/description/tags, or the whole category by its label.
  const q = query.trim().toLowerCase();

  const filterCategory = useMemo(() =>
    <T extends Item>(items: T[], label: string): T[] =>
    {
      if (!q) return items;
      if (label.toLowerCase().includes(q)) return items;
      return items.filter(item =>
        item.name.toLowerCase().includes(q)
        || (item.description ?? '').toLowerCase().includes(q)
        || item.tags.some(tag => String(tag).toLowerCase().includes(q)),
      );
    },
  [q]);

  const weapons = filterCategory(equipment.weapons, displayedText.weapons);
  const armors = filterCategory(equipment.armors, displayedText.armors);
  const shields = filterCategory(equipment.shields, displayedText.shields);
  const inventory = filterCategory(equipment.inventory, displayedText.inventory);
  const mounts = filterCategory(equipment.mounts, displayedText.mounts);

  const anyResults =
    weapons.length + armors.length + shields.length + inventory.length + mounts.length > 0;

  return (
    <div className="flex flex-col gap-6">

      <Input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={displayedText.searchByName}
        aria-label={displayedText.searchByName}
        className="w-full sm:max-w-xs"
      />

      {weapons.length > 0 && (
        <ItemsView
          items={weapons}
          label={displayedText.weapons}
          itemViewFactory={item => <WeaponViewFields weapon={item} />}
        />
      )}

      {armors.length > 0 && (
        <ItemsView
          items={armors}
          label={displayedText.armors}
          itemViewFactory={item => <ArmorViewFields armor={item} />}
        />
      )}

      {shields.length > 0 && (
        <ItemsView
          items={shields}
          label={displayedText.shields}
          itemViewFactory={item => <ShieldViewFields shield={item} />}
        />
      )}

      {inventory.length > 0 && (
        <ItemsView
          items={inventory}
          label={displayedText.inventory}
          itemViewFactory={item => <InventoryItemViewFields item={item} />}
        />
      )}

      {mounts.length > 0 && (
        <ItemsView
          items={mounts}
          label={displayedText.mounts}
          itemViewFactory={item => <MountViewFields mount={item} />}
        />
      )}

      {!anyResults && (
        <p className="px-2 py-4 text-center text-sm text-muted-foreground">
          {displayedText.notFound}
        </p>
      )}

    </div>
  );
};
