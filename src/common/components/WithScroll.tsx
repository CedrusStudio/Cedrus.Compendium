"use client";

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
}

export function WithScroll<TItem>({ items, triggerNext, hasMore, renderItem, parentClassName }: WithScrollProps<TItem>)
{
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={triggerNext}
      hasMore={hasMore}
      loader={<Loader />}
      endMessage={<EndSeparator />}
    >
      <div className={parentClassName || "flex flex-col gap-2"}>
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