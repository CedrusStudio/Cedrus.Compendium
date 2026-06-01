import { searchEntity } from "@/persistence/searchEntity";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/characters/Character";
import { Suspense } from 'react';
import BestiaryGridSkeleton from "@/application/bestiary/BestiaryTableSkeleton";
import BattleTable from "@/application/bestiary/battle/BattleTable";
import { allCharactersKey } from "@/persistence/cacheKeys";
import { createCharacterQuery } from "@/infrastructure/searchQueries/characters/createCharacterQuery";
import { CharacterWithRelations, toCharacters } from '@/persistence/mappings/characterMapping';

export default async function BattlePage()
{
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: allCharactersKey,
    queryFn: async () => toCharacters(await searchEntity<CharacterWithRelations>(createCharacterQuery()))
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BestiaryGridSkeleton />}>
        <BattleTable />
      </Suspense>
    </HydrationBoundary>
  );
};
