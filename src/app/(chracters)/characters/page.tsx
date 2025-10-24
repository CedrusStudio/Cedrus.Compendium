import CharactersHeadersGrid from "@/application/characters/grid/CharactersHeadersGrid";
import CharactersHeadersGridSkeleton from "@/application/characters/grid/CharactersHeadersGridSkeleton";
import { getAllCharactersSummary, CharacterSummary } from "@/persistence/charactersRepository";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
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

  await queryClient.prefetchQuery<CharacterSummary[]>
  ({
    queryKey: getCharacterQueryKey(searchQuery),
    queryFn: () => getAllCharactersSummary(searchQuery)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CharactersHeadersGridSkeleton />}>
        <CharactersHeadersGrid />
      </Suspense>
    </HydrationBoundary>
  );
};
