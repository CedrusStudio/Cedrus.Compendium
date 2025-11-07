import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchStancesKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import StancesList from '@/application/compendium/stances/StancesList';
import { Mode } from '@/domain/characters/combat/Mode';

type StancesPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function StancesPage(input: StancesPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const stancesQuery = createStanceKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchStancesKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Mode[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Mode>(stancesQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <StancesList />
      </Suspense>
    </HydrationBoundary>
  );
};