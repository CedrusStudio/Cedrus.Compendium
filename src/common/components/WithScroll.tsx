"use client";

import { useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import { Separator } from "@/ui/separator";

type WithScrollProps<TItem> =
{
  items: TItem[];
  triggerNext: () => void;
  hasMore: boolean;
  renderItem: (item: TItem, index: number) => React.ReactNode;
  parentClassName?: string | undefined;
  scrollableTarget?: string;
}

export function WithScroll<TItem>({ items, triggerNext, hasMore, renderItem, parentClassName, scrollableTarget }: WithScrollProps<TItem>)
{
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

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={triggerNext}
      hasMore={hasMore}
      loader={<Loader />}
      endMessage={<EndSeparator />}
      scrollableTarget={scrollableTarget}
      scrollThreshold={0.9}
    >
      <div ref={containerRef} className={parentClassName || "flex flex-col gap-2"} style={{ minHeight: '100vh' }}>
        {items.map(renderItem)}
      </div>
    </InfiniteScroll>
  );
};

function Loader()
{
  return (
    <div className="mb-4 flex flex-col items-center text-sm text-muted-foreground">
      <LoadingSpinner />
    </div>
  );
}

function EndSeparator()
{
  return (
    <div className="mt-6 flex flex-col items-center text-sm text-muted-foreground">
      <Separator className="mb-4" />
    </div>
  );
}