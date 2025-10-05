import CharactersGrid from "@/components/character/CharactersGrid";
import { searchCharacter, getAllCharacters } from "@/persistence/characterRepository";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/Character";
import { Suspense } from 'react';
import CharactersGridSkeleton from "@/components/character/CharactersGridSkeleton";
import { getCharacterQueryKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/utils/global/httpUtils";

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
