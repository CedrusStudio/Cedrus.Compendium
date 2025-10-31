import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createSearchManeuversKeyWithFallback } from "@/persistence/cacheKeys";
import { getSearchQuery, getSortDirectionQuery, getSortQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import ManeuversList from "@/application/compendium/maneuvers/ManeuversList";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverQuery';

type ManeuversPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function ManeuversPage(input: ManeuversPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const sortQuery = getSortQuery(searchParams);
  const sortDirectionQuery = getSortDirectionQuery(searchParams);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Maneuver[]>
  ({
    queryKey: createSearchManeuversKeyWithFallback(searchQuery, sortQuery, sortDirectionQuery),
    queryFn: () => searchEntity<Maneuver>(createManeuverQuery(searchQuery, sortQuery, sortDirectionQuery)),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <ManeuversList />
      </Suspense>
    </HydrationBoundary>
  );
};