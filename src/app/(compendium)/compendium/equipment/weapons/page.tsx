import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchWeaponsKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import WeaponsList from "@/application/compendium/equipment/weapons/WeaponsList";
import { Weapon } from '@/domain/characters/equipment/Weapon';
import { createWeaponKeysetQuery } from '@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery';

type WeaponsPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function WeaponsPage(input: WeaponsPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const weaponsQuery = createWeaponKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchWeaponsKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Weapon[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Weapon>(weaponsQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemListSkeleton />}>
        <WeaponsList />
      </Suspense>
    </HydrationBoundary>
  );
};
