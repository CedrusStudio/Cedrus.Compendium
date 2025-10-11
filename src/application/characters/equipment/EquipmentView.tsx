import { Equipment } from '@/domain/characters/equipment/Equipment';
import { Accordion } from "@/ui/accordion";
import WeaponView from '@/application/characters/equipment/WeaponView';
import ArmorView from '@/application/characters/equipment/ArmorView';
import ShieldView from '@/application/characters/equipment/ShieldView';
import ItemsView from '@/application/characters/equipment/ItemsView';

export default function EquipmentView({ equipment }: { equipment: Equipment })
{
  return (
    <Accordion type="multiple">

      <ItemsView 
        items={equipment.weapons} 
        label='Bronie'
        itemViewFactory={item => <WeaponView weapon={item} />} 
      />

      <ItemsView 
        items={equipment.armors} 
        label='Zbroje'
        itemViewFactory={item => <ArmorView armor={item} />} 
      />

      <ItemsView 
        items={equipment.shields} 
        label='Tarcze'
        itemViewFactory={item => <ShieldView shield={item} />} 
      />

      <ItemsView 
        items={equipment.inventory} 
        label='Wyposarzenie'
        itemViewFactory={item => <span>{item.description}</span>} 
      />

      <ItemsView 
        items={equipment.mounts} 
        label='Konie'
        itemViewFactory={item => <span>{item.description}</span>} 
      />

    </Accordion>
  );
};