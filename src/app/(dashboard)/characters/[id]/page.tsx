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

export default async function CharacterPage({ params, searchParams }: CharacterProps)
{
  // seedDatabase();
  const queryClient = new QueryClient();

  const character = await queryClient.ensureQueryData
  ({
    queryKey: ['character', params.id],
    queryFn: () => getCharacter(params.id),
  });

  if (!character) throw Error("Character not found");
  const tab = isCharacterTab(searchParams?.tab) ? searchParams.tab : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterView character={character} tab={tab} />
    </HydrationBoundary>
  );
};
