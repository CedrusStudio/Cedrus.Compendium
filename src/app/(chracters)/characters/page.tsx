import CharactersHeadersList from "@/application/characters/list/CharactersHeadersList";
import CharactersHeadersListSkeleton from "@/application/characters/list/CharactersHeadersListSkeleton";
import { searchEntity } from "@/persistence/searchEntity";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createSearchCharactersKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { CharacterSummary, createCharacterSummaryQuery } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";

type CharactersPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function CharactersPage(input: CharactersPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery<CharacterSummary[]>
  ({
    queryKey: createSearchCharactersKey(searchQuery || '', emptyUlid, undefined, DEFAULT_PAGE_SIZE),
    queryFn: () => searchEntity<CharacterSummary>(createCharacterSummaryQuery(searchQuery, emptyUlid, undefined, DEFAULT_PAGE_SIZE))
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CharactersHeadersListSkeleton />}>
        <CharactersHeadersList />
      </Suspense>
    </HydrationBoundary>
  );
};
