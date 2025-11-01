import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createSearchManeuversKeyWithFallback } from "@/persistence/cacheKeys";
import { getCursorQuery, getSearchQuery, getSortDirectionQuery, getSortQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import ManeuversList from "@/application/compendium/maneuvers/ManeuversList";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

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
  const cursor = getCursorQuery(searchParams) || "0000WZXVD68PVAE7QCBNH45B8F";
  const pagination = { cursor, pageSize: DEFAULT_PAGE_SIZE };
  const maneuversQuery = createManeuverQuery(searchQuery, sortQuery, sortDirectionQuery, pagination);
  const queryKey = createSearchManeuversKeyWithFallback(searchQuery, sortQuery, sortDirectionQuery);

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