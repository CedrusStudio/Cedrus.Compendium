import { Item } from '@/domain/characters/equipment/Item';
import { PropsWithChildren } from 'react';

type ItemsViewProps<T extends Item> =
{
  label: string;
  items: T[];
  itemViewFactory: (item: T, index: number) => React.ReactNode;
  /** Items removed this editing session — kept around so they can still be restored. */
  removedItems?: T[];
  removedItemViewFactory?: (item: T) => React.ReactNode;
}

export default function ItemsView<T extends Item>({ items, itemViewFactory, label, children, removedItems = [], removedItemViewFactory }: PropsWithChildren<ItemsViewProps<T>>)
{
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-lg font-semibold capitalize">{label}</h3>
        {children}
      </div>
      {
        items.length > 0 && (
          <div className="flex flex-col gap-3">
          {
            items.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
              >
                {itemViewFactory(item, index)}
              </div>
            ))
          }
          </div>
        )
      }
      {
        removedItems.length > 0 && removedItemViewFactory && (
          <div className="flex flex-col gap-3">
          {
            removedItems.map(item => (
              <div
                key={item.id}
                className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
              >
                {removedItemViewFactory(item)}
              </div>
            ))
          }
          </div>
        )
      }
    </div>
  )
}
