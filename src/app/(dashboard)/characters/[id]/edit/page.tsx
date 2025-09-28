import { getCharacter } from '@/persistence/characterRepository';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { isCharacterTab } from '@/utils/tabsUtils';
import EditCharacterView from '@/components/character/edit/EditCharacterView';

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
  const character = await queryClient.ensureQueryData
  ({
    queryKey: ['character', params.id],
    queryFn: () => getCharacter(params.id),
  });

  if (!character) throw Error("Character not found");
  const tab = isCharacterTab(searchParams?.tab) ? searchParams.tab : "character";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditCharacterView character={character} tab={tab} />
    </HydrationBoundary>
  );
};
