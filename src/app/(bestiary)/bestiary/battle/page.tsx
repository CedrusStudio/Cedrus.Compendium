import { searchEntity } from "@/persistence/searchEntity";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/characters/Character";
import RequestContent from "@/common/components/RequestContent";
import BestiaryGridSkeleton from "@/application/bestiary/BestiaryTableSkeleton";
import BattleTable from "@/application/bestiary/battle/BattleTable";
import { allCharactersKey } from "@/persistence/cacheKeys";
import { createCharacterQuery } from "@/infrastructure/searchQueries/characters/createCharacterQuery";
import { CharacterWithRelations, toCharacters } from '@/persistence/mappings/characterMapping';

export default function BattlePage()
{
  return (
    <RequestContent fallback={<BestiaryGridSkeleton />}>
      <BattleContent />
    </RequestContent>
  );
}

async function BattleContent()
{
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: allCharactersKey,
    queryFn: async () => toCharacters(await searchEntity<CharacterWithRelations>(createCharacterQuery()))
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BattleTable />
    </HydrationBoundary>
  );
};
