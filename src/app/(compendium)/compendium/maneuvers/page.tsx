import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchManeuversKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import ManeuversList from "@/application/compendium/maneuvers/ManeuversList";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';

type ManeuversPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function ManeuversPage(input: ManeuversPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const maneuversQuery = createManeuverKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchManeuversKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Maneuver[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Maneuver>(maneuversQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <ManeuversList />
      </Suspense>
    </HydrationBoundary>
  );
};