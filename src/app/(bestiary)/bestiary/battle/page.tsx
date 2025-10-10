import { getAllCharacters } from "@/persistence/characterRepository";
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

export default async function BattlePage()
{
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: allCharactersKey,
    queryFn: () => getAllCharacters()
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BestiaryGridSkeleton />}>
        <BattleTable />
      </Suspense>
    </HydrationBoundary>
  );
};
