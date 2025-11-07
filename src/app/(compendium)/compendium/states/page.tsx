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
import { State } from '@/generated/prisma/client';
import StatesList from '@/application/compendium/states/StatesList';

type StatesPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function StatesPage(input: StatesPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const statesQuery = createStateKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchStatesKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<State[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<State>(statesQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <StatesList />
      </Suspense>
    </HydrationBoundary>
  );
};