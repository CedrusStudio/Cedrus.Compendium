import { getCharacterById } from '@/persistence/characters/charactersRepository';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { isCharacterTab } from '@/common/tabsUtils';
import EditCharacterView from '@/application/characters/edit/EditCharacterView';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function EditPage(props: { params: Params, searchParams: SearchParams })
{
  const params = await props.params
  const searchParams = await props.searchParams
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery 
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => getCharacterById(params.id),
  });

  const tab = isCharacterTab(searchParams.tab) ? searchParams.tab : "character";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditCharacterView tab={tab} />
    </HydrationBoundary>
  );
};
