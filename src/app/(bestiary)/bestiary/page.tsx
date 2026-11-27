import { searchEntity } from "@/persistence/searchEntity";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/characters/Character";
import RequestContent from "@/common/components/RequestContent";
import BestiaryTable from "@/application/bestiary/BestiaryTable";
import BestiaryGridSkeleton from "@/application/bestiary/BestiaryTableSkeleton";
import { allCharactersKey } from "@/persistence/cacheKeys";
import { createCharacterQuery } from "@/infrastructure/searchQueries/characters/createCharacterQuery";
import { CharacterWithRelations, toCharacters } from '@/persistence/mappings/characterMapping';

export default function BestiaryPage()
{
  return (
    <RequestContent fallback={<BestiaryGridSkeleton />}>
      <BestiaryContent />
    </RequestContent>
  );
}

async function BestiaryContent()
{
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: allCharactersKey,
    queryFn: async () => toCharacters(await searchEntity<CharacterWithRelations>(createCharacterQuery()))
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BestiaryTable />
    </HydrationBoundary>
  );
};
