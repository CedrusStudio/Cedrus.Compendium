import { getCharacter } from '@/persistence/characterRepository';

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import CharacterView from '@/components/character/CharacterView';
import { isCharacterTab } from '@/utils/tabsUtils';
// import seedDatabase from '@/persistence/seed';

type CharacterProps = 
{
    params: 
    {
        id: string;
    },
    searchParams: { [key: string]: string | string[] | undefined }
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

  const searchParams = await input.searchParams;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterView character={character} tab={isCharacterTab(searchParams?.tab) ? searchParams.tab : undefined} />
    </HydrationBoundary>
  );
};
