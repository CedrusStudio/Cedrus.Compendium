import { searchCharacter, getAllCharacters } from "@/persistence/characterRepository";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/characters/Character";
import { Suspense } from 'react';
import { getCharacterQueryKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import BestiaryTable from "@/application/bestiary/table/BestiaryTable";
import BestiaryGridSkeleton from "@/application/bestiary/table/BestiaryTableSkeleton";

type CharactersPageProps = 
{
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function BestiaryPage(input: CharactersPageProps)
{
  const searchQuery = await getSearchQuery(input);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: getCharacterQueryKey(searchQuery),
    queryFn: () => searchQuery ? searchCharacter(searchQuery) : getAllCharacters()
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BestiaryGridSkeleton />}>
        <BestiaryTable />
      </Suspense>
    </HydrationBoundary>
  );
};
