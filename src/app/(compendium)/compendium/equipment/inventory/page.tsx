import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchInventoryKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import InventoryList from "@/application/compendium/equipment/inventory/InventoryList";
import { Item } from '@/domain/characters/equipment/Item';
import { createInventoryItemKeysetQuery } from '@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery';

type InventoryPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function InventoryPage(input: InventoryPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const inventoryQuery = createInventoryItemKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchInventoryKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Item[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Item>(inventoryQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <InventoryList />
      </Suspense>
    </HydrationBoundary>
  );
};
