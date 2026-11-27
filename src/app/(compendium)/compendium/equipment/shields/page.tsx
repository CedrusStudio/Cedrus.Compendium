import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchShieldsKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import ShieldsList from "@/application/compendium/equipment/shields/ShieldsList";
import { Shield } from '@/domain/characters/equipment/Shield';
import { createShieldKeysetQuery } from '@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery';

type ShieldsPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default function ShieldsPage(input: ShieldsPageProps)
{
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <ShieldsContent {...input} />
    </Suspense>
  );
}

async function ShieldsContent(input: ShieldsPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const shieldsQuery = createShieldKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchShieldsKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Shield[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Shield>(shieldsQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ShieldsList />
    </HydrationBoundary>
  );
};
