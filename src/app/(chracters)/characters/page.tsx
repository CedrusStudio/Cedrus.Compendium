import CharactersGrid from "@/application/characters/grid/CharactersGrid";
import CharactersGridSkeleton from "@/application/characters/grid/CharactersGridSkeleton";
import { searchCharacters, getAllCharacters } from "@/persistence/charactersRepository";
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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function CharactersPage(input: CharactersPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = await getSearchQuery(searchParams);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<Character[]>
  ({
    queryKey: getCharacterQueryKey(searchQuery),
    queryFn: () => searchQuery ? searchCharacters(searchQuery) : getAllCharacters()
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CharactersGridSkeleton />}>
        <CharactersGrid />
      </Suspense>
    </HydrationBoundary>
  );
};
