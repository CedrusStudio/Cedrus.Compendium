import { getCharacter } from '@/persistence/characterRepository';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { isCharacterTab } from '@/common/tabsUtils';
import EditCharacterView from '@/components/character/edit/EditCharacterView';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';

type EditCharacterProps = 
{
    params: 
    {
        id: string;
    },
    searchParams: { [key: string]: string | string[] | undefined }
};

export default async function EditPage(input: EditCharacterProps)
{
  const params = await input.params;
  const searchParams = await input.searchParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => getCharacter(params.id),
  });

  const tab = isCharacterTab(searchParams?.tab) ? searchParams.tab : "character";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditCharacterView tab={tab} />
    </HydrationBoundary>
  );
};
