import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchStatesKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';
import StatesList from '@/application/compendium/states/StatesList';
import { Mode } from '@/domain/characters/combat/Mode';

type StatesPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default function StatesPage(input: StatesPageProps)
{
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <StatesContent {...input} />
    </Suspense>
  );
}

async function StatesContent(input: StatesPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const statesQuery = createStateKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchStatesKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Mode[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Mode>(statesQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StatesList />
    </HydrationBoundary>
  );
};