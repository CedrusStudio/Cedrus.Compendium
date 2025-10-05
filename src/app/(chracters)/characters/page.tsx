import CharactersGrid from "@/application/characters/grid/CharactersGrid";
import CharactersGridSkeleton from "@/application/characters/grid/CharactersGridSkeleton";
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

type CharactersPageProps = 
{
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CharactersPage(input: CharactersPageProps)
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
      <Suspense fallback={<CharactersGridSkeleton />}>
        <CharactersGrid />
      </Suspense>
    </HydrationBoundary>
  );
};
