import { getCharacterById } from '@/persistence/charactersRepository';

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import CharacterView from '@/application/characters/CharacterView';
import { isCharacterTab } from '@/common/tabsUtils';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function CharacterPage(props: {params: Params, searchParams: SearchParams})
{
  const params = await props.params;
  const searchParams = await props.searchParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => getCharacterById(params.id),
  });

  const tab = isCharacterTab(searchParams.tab) ? searchParams.tab : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterView tab={tab} />
    </HydrationBoundary>
  );
};
