import TagsView from '@/common/components/tags/TagsView';
import { Item } from '@/domain/characters/equipment/Item';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";
import { ReactNode } from 'react';

type ItemAccordionProps = 
{
  item: Item;
  children: ReactNode;
}

export default function ItemAccordion({ item, children }: ItemAccordionProps)
{
  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger>
        <div className='flex flex-row gap-2 place-content-center'>
          <span>{item.name}</span>
          <TagsView tags={item.tags} variant="secondary" />
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
