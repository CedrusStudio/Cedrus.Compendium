import TagsView from '@/common/components/TagsView';
import { Item } from '@/domain/characters/equipment/Item';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";
import { PropsWithChildren } from 'react';

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
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>
                  <div className='flex flex-row gap-2 place-content-center'>
                    <span>{item.name}</span>
                    <TagsView tags={item.tags} variant="secondary" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    {itemViewFactory(item, index)}
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