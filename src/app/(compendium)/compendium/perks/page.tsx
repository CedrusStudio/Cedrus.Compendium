import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchPerksKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import { createPerkKeysetQuery } from '@/infrastructure/searchQueries/perks/createPerkKeysetQuery';
import { Perk } from '@/generated/prisma/client';
import PerksList from '@/application/compendium/perks/PerksList';

type PerksPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function PerksPage(input: PerksPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const perksQuery = createPerkKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchPerksKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Perk[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Perk>(perksQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <PerksList />
      </Suspense>
    </HydrationBoundary>
  );
};