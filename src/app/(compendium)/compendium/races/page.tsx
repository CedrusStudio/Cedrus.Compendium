import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchRacesKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import { createRaceKeysetQuery } from '@/infrastructure/searchQueries/races/createRaceKeysetQuery';
import RacesList from '@/application/compendium/races/RacesList';
import { Race } from '@/domain/Race';

type RacesPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function RacesPage(input: RacesPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const racesQuery = createRaceKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchRacesKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Race[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Race>(racesQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <RacesList />
      </Suspense>
    </HydrationBoundary>
  );
};
