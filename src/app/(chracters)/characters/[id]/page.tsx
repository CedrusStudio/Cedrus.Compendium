import { getCharacterById } from '@/persistence/charactersRepository';

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import CharacterView from '@/application/characters/CharacterView';
import { isCharacterTab } from '@/common/tabsUtils';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';

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
  const searchParams = input.searchParams;
  const params = input.params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => getCharacterById(params.id),
  });

  const tab = isCharacterTab(searchParams?.tab) ? searchParams.tab : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterView tab={tab} />
    </HydrationBoundary>
  );
};
