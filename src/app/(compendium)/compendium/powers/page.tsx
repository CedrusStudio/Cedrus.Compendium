import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchPowerSpecificationsKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import { type PowerSpecification } from '@/domain/characters/combat/Power';
import { createPowerSpecificationKeysetQuery } from '@/infrastructure/searchQueries/powers/createPowerSpecificationKeysetQuery';
import PowersSpecificationList from '@/application/compendium/powers/PowersSpecificationsList';

type PowersSpecificationsPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function PowersSpecificationsPage(input: PowersSpecificationsPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const powerSpecificationsQuery = createPowerSpecificationKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchPowerSpecificationsKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<PowerSpecification[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<PowerSpecification>(powerSpecificationsQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <PowersSpecificationList />
      </Suspense>
    </HydrationBoundary>
  );
};