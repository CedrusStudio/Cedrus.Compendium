import CharactersGrid from "@/components/character/CharactersGrid";
import { searchCharacter, getAllCharacters } from "@/persistence/characterRepository";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Character } from "@/domain/Character";

type CharactersPageProps = 
{
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CharactersPage(input: CharactersPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = searchParams?.search as string | undefined;
  const queryClient = new QueryClient();

  if (searchQuery) 
  {
    await queryClient.prefetchQuery
    ({
      queryKey: ['characters', 'search', searchQuery],
      queryFn: () => searchCharacter(searchQuery!),
    });
  }
  else
  {
    await queryClient.prefetchQuery
    ({
      queryKey: ['characters', 'all'],
      queryFn: () => getAllCharacters(),
    });
  }

  const allCharacters = searchQuery 
    ? queryClient.getQueryData<Character[]>(['characters', 'search', searchQuery]) ?? await searchCharacter(searchQuery)
    : queryClient.getQueryData<Character[]>(['characters', "all"]) ?? await getAllCharacters();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
       <CharactersGrid characters={allCharacters} />
    </HydrationBoundary>
  );
};
