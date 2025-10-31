"use client";

import InfiniteScroll from "react-infinite-scroll-component";

type WithReactScrollProps<TItem> =
{
  items: TItem[];
  triggerNext: () => void;
  hasMore: boolean;
  renderItem: (item: TItem, index: number) => React.ReactNode;
  parentClassName?: string | undefined;
}

export function WithReactScroll<TItem>({ items, triggerNext, hasMore, renderItem, parentClassName }: WithReactScrollProps<TItem>)
{
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={triggerNext}
      hasMore={hasMore}
      loader={<p>Loading...</p>}
      endMessage={<p>No more data to load.</p>}
      
    >
      <div className={parentClassName || "flex flex-col gap-2"}>
        { items.map(renderItem) }
      </div>
    </InfiniteScroll>
  );
};