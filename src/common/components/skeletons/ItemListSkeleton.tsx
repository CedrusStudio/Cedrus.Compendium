import { Skeleton } from "@/ui/skeleton";

export default function ItemListSkeleton()
{
  return (
    <div>
      <ItemSkeleton />
      <ItemSkeleton />
      <ItemSkeleton />
      <ItemSkeleton />
      <ItemSkeleton />
    </div>
  );
};

function ItemSkeleton()
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2 min-h-24">

      <div className="p-2 rounded-md w-full">
        <Skeleton className="h-9 w-48" />
      </div>

      <div className="flex flex-row gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-48" />
      </div>

    </div>
  );
}