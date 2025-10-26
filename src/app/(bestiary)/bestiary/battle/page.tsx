import { searchEntity } from "@/persistence/searchEntity";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/characters/Character";
import { Suspense } from 'react';
import BestiaryGridSkeleton from "@/application/bestiary/BestiaryTableSkeleton";
import BattleTable from "@/application/bestiary/BattleTable";
import { allCharactersKey } from "@/persistence/cacheKeys";
import { createCharacterQuery } from "@/persistence/characters/createCharacterQuery";

export default async function BattlePage()
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
        <BattleTable />
      </Suspense>
    </HydrationBoundary>
  );
};
