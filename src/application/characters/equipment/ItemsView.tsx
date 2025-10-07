import { Item } from '@/domain/characters/Character';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";

type ItemsViewProps<T extends Item> = 
{
  label: string;
  items: T[];
  itemViewFactory: (item: T, index: number) => React.ReactNode;
}

export default function ItemsView<T extends Item>({ items, itemViewFactory, label }: ItemsViewProps<T>)
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
              items.map((item, index) => (
                <AccordionItem key={item.name} value={item.name}>
                    <AccordionTrigger>{item.name}</AccordionTrigger>
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