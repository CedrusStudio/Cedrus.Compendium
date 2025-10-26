import { searchEntity } from "@/persistence/searchEntity";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/characters/Character";
import { Suspense } from 'react';
import BestiaryTable from "@/application/bestiary/BestiaryTable";
import BestiaryGridSkeleton from "@/application/bestiary/BestiaryTableSkeleton";
import { allCharactersKey } from "@/persistence/cacheKeys";
import { createCharacterQuery } from "@/infrastructure/searchQueries/characters/createCharacterQuery";

export default async function BestiaryPage()
{
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: allCharactersKey,
    queryFn: () => searchEntity<Character>(createCharacterQuery())
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BestiaryGridSkeleton />}>
        <BestiaryTable />
      </Suspense>
    </HydrationBoundary>
  );
};
