"use client";

import { ReactNode, useMemo } from "react";
import { groupByName, GroupedItem } from "@/common/global/grouping";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import { Badge } from "@/ui/badge";

interface GroupedItemsListProps<T extends { id: string; name: string; grade: number }> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  className?: string;
}

/**
 * Generic component that displays items grouped by name with grades shown in accordion headers.
 * Items are automatically grouped by name and sorted by grade within each group.
 */
export default function GroupedItemsList<T extends { id: string; name: string; grade: number }>({
  items,
  renderItem,
  className = "flex flex-col gap-2",
}: GroupedItemsListProps<T>) {
  const groupedItems = useMemo(() => groupByName(items), [items]);

  if (groupedItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Accordion type="multiple" className="w-full space-y-2">
        {groupedItems.map((group: GroupedItem<T>) => (
          <AccordionItem
            key={group.name}
            value={group.name}
            className="border rounded-md bg-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{group.name}</span>
                <div className="flex gap-1">
                  {group.items.map((item) => (
                    <Badge key={item.id} variant="secondary" className="text-xs">
                      {item.grade}
                    </Badge>
                  ))}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-2">
              {group.items.map((item) => renderItem(item))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
