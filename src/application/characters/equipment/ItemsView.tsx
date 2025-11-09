import { Item } from '@/domain/characters/equipment/Item';
import { PropsWithChildren } from 'react';
import ItemAccordion from '@/application/characters/equipment/ItemAccordion';

type ItemsViewProps<T extends Item> = 
{
  label: string;
  items: T[];
  itemViewFactory: (item: T, index: number) => React.ReactNode;
}

export default function ItemsView<T extends Item>({ items, itemViewFactory, label, children }: PropsWithChildren<ItemsViewProps<T>>)
{
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-lg font-semibold capitalize">{label}</h3>
        {children}
      </div>
      {
        items.length > 0 && (
          <div>
          {
            items.map((item, index) => (
              <ItemAccordion key={item.id} item={item}>
                {itemViewFactory(item, index)}
              </ItemAccordion>
            ))
          }
          </div>
        )
      }
    </>
  )
}