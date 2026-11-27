import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchMountsKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import MountsList from "@/application/compendium/equipment/mounts/MountsList";
import { Mount } from '@/domain/characters/equipment/Mount';
import { createMountKeysetQuery } from '@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery';

type MountsPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default function MountsPage(input: MountsPageProps)
{
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <MountsContent {...input} />
    </Suspense>
  );
}

async function MountsContent(input: MountsPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const mountsQuery = createMountKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchMountsKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Mount[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Mount>(mountsQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MountsList />
    </HydrationBoundary>
  );
};
