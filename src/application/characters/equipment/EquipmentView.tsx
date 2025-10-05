import { Equipment, Item } from '@/domain/characters/Character';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion"
import WeaponView from '@/application/characters/equipment/WeaponView';
import ArmorView from '@/application/characters/equipment/ArmorView';
import ShieldView from '@/application/characters/equipment/ShieldView';

export default function EquipmentView({ equipment }: { equipment: Equipment })
{
  console.log(equipment);
  return (
    <Accordion type="multiple">

      <ItemsView 
        items={equipment.weapons} 
        label={`Bronie`}
        itemViewFactory={(item) => <WeaponView weapon={item} />} 
      />

      <ItemsView 
        items={equipment.armors} 
        label={`Zbroje`}
        itemViewFactory={(item) => <ArmorView armor={item} />} 
      />

      <ItemsView 
        items={equipment.shields} 
        label={`Tarcze`}
        itemViewFactory={(item) => <ShieldView shield={item} />} 
      />

      <ItemsView 
        items={equipment.inventory} 
        label={`Wyposarzenie`}
        itemViewFactory={(item) => <span>{item.description}</span>} 
      />

      <ItemsView 
        items={equipment.horses} 
        label={`Konie`}
        itemViewFactory={(item) => <span>{item.description}</span>} 
      />

    </Accordion>
  );
};

type ItemsViewProps<T extends Item> = 
{
  label: string;
  items: T[];
  itemViewFactory: (item: T) => React.ReactNode;
}

function ItemsView<T extends Item>({ items, itemViewFactory, label }: ItemsViewProps<T>)
{
  return (
    <>
      {
        items.length > 0 && (
          <div>
            <div className="flex items-center justify-center gap-2 mb-3 px-1">
              <h3 className="text-lg font-semibold">{label}</h3>
            </div>
            {
              items.map(item => (
              <AccordionItem key={item.name} value={item.name}>
                  <AccordionTrigger>{item.name}</AccordionTrigger>
                  <AccordionContent>
                    {itemViewFactory(item)}
                  </AccordionContent>
              </AccordionItem>
              ))
            }
        </div>
        )
      }
    </>
  )
}