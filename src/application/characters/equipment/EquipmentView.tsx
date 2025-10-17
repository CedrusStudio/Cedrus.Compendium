import { Equipment } from '@/domain/characters/equipment/Equipment';
import { Accordion } from "@/ui/accordion";
import WeaponView from '@/application/characters/equipment/WeaponView';
import ArmorView from '@/application/characters/equipment/ArmorView';
import ShieldView from '@/application/characters/equipment/ShieldView';
import ItemsView from '@/application/characters/equipment/ItemsView';
import { displayedText } from '@/presentation/translations';

export default function EquipmentView({ equipment }: { equipment: Equipment })
{
  return (
    <Accordion type="multiple">

      <ItemsView 
        items={equipment.weapons} 
        label={displayedText.weapons}
        itemViewFactory={item => <WeaponView weapon={item} />} 
      />

      <ItemsView 
        items={equipment.armors} 
        label={displayedText.armors}
        itemViewFactory={item => <ArmorView armor={item} />} 
      />

      <ItemsView 
        items={equipment.shields} 
        label={displayedText.shields}
        itemViewFactory={item => <ShieldView shield={item} />} 
      />

      <ItemsView 
        items={equipment.inventory} 
        label={displayedText.inventory}
        itemViewFactory={item => <span>{item.description}</span>} 
      />

      <ItemsView 
        items={equipment.mounts} 
        label={displayedText.mounts}
        itemViewFactory={item => <span>{item.description}</span>} 
      />

    </Accordion>
  );
};