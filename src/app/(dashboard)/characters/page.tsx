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

export default async function CharactersPage({ searchParams }: CharactersPageProps)
{
  const searchQuery = Array.isArray(searchParams?.search) ? searchParams.search[0] : searchParams?.search;
  const queryClient = new QueryClient();

  const queryKey = searchQuery 
    ? ['characters', 'search', searchQuery] 
    : ['characters', 'all'];

  const characters = await queryClient.ensureQueryData<Character[]>
  ({
      queryKey: queryKey,
      queryFn: () => searchQuery ? searchCharacter(searchQuery) : getAllCharacters(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
       <CharactersGrid characters={characters} />
    </HydrationBoundary>
  );
};
