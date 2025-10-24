import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { getManeuverQueryKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchManeuvers } from "@/persistence/maneuversRepository";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import ManeuversList from "@/application/compendium/maneuvers/ManeuversList";
import { Maneuver } from '@/domain/characters/combat/Maneuver';

type ManeuversPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function ManeuversPage(input: ManeuversPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = await getSearchQuery(searchParams);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Maneuver[]>
  ({
    queryKey: getManeuverQueryKey(searchQuery),
    queryFn: () => searchManeuvers(searchQuery)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <ManeuversList />
      </Suspense>
    </HydrationBoundary>
  );
};