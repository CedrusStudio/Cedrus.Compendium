"use client";

import { ReactNode, useMemo, useEffect, useRef, useState } from "react";
import { groupByName, GroupedItem } from "@/common/global/grouping";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import { Separator } from "@/ui/separator";
import { Search } from "lucide-react";

interface GroupedItemsListProps<T extends { id: string; name: string; grade: number }> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  triggerNext: () => void;
  hasMore: boolean;
  groupName?: string | null;
  onScopeToGroup?: (groupName: string) => void;
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
  groupName,
  onScopeToGroup,
  className = "flex flex-col gap-2",
}: GroupedItemsListProps<T>) {
  const groupedItems = useMemo(
    () => groupByName(groupName == null ? items : items.filter(item => item.name === groupName)),
    [items, groupName],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Auto-fetch more items if container is not scrollable and more data is available
  useEffect(() => {
    if (!containerRef.current || !hasMore || items.length === 0 || document.documentElement.scrollHeight > window.innerHeight) return;
    const timer = setTimeout(triggerNext, 100);
    return () => clearTimeout(timer);
  }, [items.length, hasMore, triggerNext]);

  if (groupedItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-w-0">
    <InfiniteScroll
      dataLength={items.length}
      next={triggerNext}
      hasMore={hasMore}
      loader={<Loader />}
      endMessage={<EndSeparator />}
      scrollThreshold={0.9}
    >
      <div ref={containerRef} className={className}>
        <Accordion type="multiple" className="w-full space-y-2" value={expandedGroups} onValueChange={setExpandedGroups}>
          {groupedItems.map((group: GroupedItem<T>) => (
            <AccordionItem
              key={group.name}
              value={group.name}
              className="border rounded-md bg-card"
            >
              <div className="flex items-center gap-1 pr-2">
                <div className="min-w-0 flex-1">
                  <AccordionTrigger className="items-center px-4 hover:no-underline hover:bg-accent/50">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-semibold">{group.name}</span>
                      <span className="flex flex-wrap gap-1">
                        {group.items.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.grade}
                          </Badge>
                        ))}
                      </span>
                    </span>
                  </AccordionTrigger>
                </div>
                {onScopeToGroup && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    disabled={group.name === groupName}
                    onClick={() => {
                      setExpandedGroups(prev => prev.includes(group.name) ? prev : [...prev, group.name]);
                      onScopeToGroup(group.name);
                    }}
                    aria-label={group.name === groupName ? `Wybrana grupa „${group.name}”` : `Zawęź do grupy „${group.name}”`}
                  >
                    <Search aria-hidden="true" className="h-3 w-3" />
                    {group.name === groupName ? "Wybrana grupa" : "Zawęź do grupy"}
                  </Button>
                )}
              </div>
              <AccordionContent className="px-4 pb-4 space-y-2">
                {group.items.map((item) => renderItem(item))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </InfiniteScroll>
    </div>
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
