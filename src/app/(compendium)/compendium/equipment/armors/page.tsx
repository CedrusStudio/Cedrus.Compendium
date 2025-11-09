import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchArmorsKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import ArmorsList from "@/application/compendium/equipment/armors/ArmorsList";
import { Armor } from '@/domain/characters/equipment/Armor';
import { createArmorKeysetQuery } from '@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery';

type ArmorsPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function ArmorsPage(input: ArmorsPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const armorsQuery = createArmorKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchArmorsKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Armor[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Armor>(armorsQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <ArmorsList />
      </Suspense>
    </HydrationBoundary>
  );
};
