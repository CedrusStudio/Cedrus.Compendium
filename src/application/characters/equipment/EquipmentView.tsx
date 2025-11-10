import { Equipment } from '@/domain/characters/equipment/Equipment';
import ItemsView from '@/application/characters/equipment/ItemsView';
import { displayedText } from '@/presentation/translations';
import InventoryItemViewFields from '@/application/common/equipment/Views/InventoryItemViewFields';
import MountViewFields from '@/application/common/equipment/Views/MountViewFields';
import ArmorViewFields from '@/application/common/equipment/Views/ArmorViewFields';
import ShieldViewFields from '@/application/common/equipment/Views/ShieldViewFields';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';

export default function EquipmentView({ equipment }: { equipment: Equipment })
{
  return (
    <div className="flex flex-col gap-6">

      {
        equipment.weapons.length > 0 && (
          <ItemsView 
            items={equipment.weapons} 
            label={displayedText.weapons}
            itemViewFactory={item => <WeaponViewFields weapon={item} />} 
          />
        )
      }

      {
        equipment.armors.length > 0 && (
          <ItemsView 
            items={equipment.armors} 
            label={displayedText.armors}
            itemViewFactory={item => <ArmorViewFields armor={item} />} 
          />
        )
      }

      {
        equipment.shields.length > 0 && (
          <ItemsView 
            items={equipment.shields} 
            label={displayedText.shields}
            itemViewFactory={item => <ShieldViewFields shield={item} />} 
          />
        )
      }

      {
        equipment.inventory.length > 0 && (
          <ItemsView 
            items={equipment.inventory} 
            label={displayedText.inventory}
            itemViewFactory={item => <InventoryItemViewFields item={item} />} 
          />
        )
      }

      {
        equipment.mounts.length > 0 && (
          <ItemsView 
            items={equipment.mounts} 
            label={displayedText.mounts}
            itemViewFactory={item => <MountViewFields mount={item} />} 
          />
        )
      }

    </div>
  );
};