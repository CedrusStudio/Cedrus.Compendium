import CharactersGrid from "@/components/character/CharactersGrid";
import { searchCharacter, getAllCharacters } from "@/persistence/characterRepository";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/Character";
import { Suspense } from 'react';

type CharactersPageProps = 
{
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CharactersPage(input: CharactersPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = Array.isArray(searchParams?.search) ? searchParams.search[0] : searchParams?.search;
  const queryClient = new QueryClient();

  const queryKey = searchQuery 
    ? ['characters', 'search', searchQuery] 
    : ['characters', 'all'];

  await queryClient.prefetchQuery<Character[]>
  ({
      queryKey: queryKey,
      queryFn: () => 
      { 
        console.log("Prefetching characters from server...");
        return searchQuery ? searchCharacter(searchQuery) : getAllCharacters(); 
      },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CharactersGridSkeleton />}>
        <CharactersGrid />
      </Suspense>
    </HydrationBoundary>
  );
};

function CharactersGridSkeleton() 
{
  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 m-4">
      LOADING LOADING LOADING
    </div>
  );
}