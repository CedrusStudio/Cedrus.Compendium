import { getCharacter } from '@/persistence/characterRepository';

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import CharacterView from '@/components/character/CharacterView';
// import seedDatabase from '@/persistence/seed';

type CharacterProps = 
{
    params: 
    {
        id: string;
    };
};

export default async function CharacterPage(input: CharacterProps)
{
  // seedDatabase();
  const params = await input.params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery
  ({
    queryKey: ['character', params.id],
    queryFn: () => getCharacter(params.id),
  });

  const character = await getCharacter(params.id);
  if (!character) throw Error("Character not found");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterView character={character} />
    </HydrationBoundary>
  );
};