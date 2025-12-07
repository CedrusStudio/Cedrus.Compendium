"use client";

import { ReactNode, useMemo, useEffect, useRef } from "react";
import { groupByName, GroupedItem } from "@/common/global/grouping";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import { Badge } from "@/ui/badge";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import { Separator } from "@/ui/separator";

interface GroupedItemsListProps<T extends { id: string; name: string; grade: number }> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  triggerNext: () => void;
  hasMore: boolean;
  className?: string;
}

/**
 * Generic component that displays items grouped by name with grades shown in accordion headers.
 * Items are automatically grouped by name and sorted by grade within each group.
 * Supports infinite scrolling to load more items.
 */
export default function GroupedItemsList<T extends { id: string; name: string; grade: number }>({
  items,
  renderItem,
  triggerNext,
  hasMore,
  className = "flex flex-col gap-2",
}: GroupedItemsListProps<T>) {
  const groupedItems = useMemo(() => groupByName(items), [items]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fetch more items if container is not scrollable and more data is available
  useEffect(() => {
    const checkScrollable = () => {
      if (containerRef.current && hasMore) {
        const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
        if (!isScrollable && items.length > 0) {
          // Delay to avoid rapid successive calls
          const timer = setTimeout(() => {
            triggerNext();
          }, 100);
          return () => clearTimeout(timer);
        }
      }
    };

    checkScrollable();
  }, [items.length, hasMore, triggerNext]);

  if (groupedItems.length === 0) {
    return null;
  }

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={triggerNext}
      hasMore={hasMore}
      loader={<Loader />}
      endMessage={<EndSeparator />}
      scrollThreshold={0.9}
    >
      <div ref={containerRef} className={className} style={{ minHeight: '100vh' }}>
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
    </InfiniteScroll>
  );
}

function Loader() {
  return (
    <div className="mb-4 flex flex-col items-center text-sm text-muted-foreground">
      <LoadingSpinner />
    </div>
  );
}

function EndSeparator() {
  return (
    <div className="mt-6 flex flex-col items-center text-sm text-muted-foreground">
      <Separator className="mb-4" />
    </div>
  );
}
