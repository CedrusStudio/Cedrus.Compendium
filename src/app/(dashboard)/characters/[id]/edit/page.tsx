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
  const character = await getCharacter(params.id);
  if (!character) throw Error("Character not found");

  const queryClient = new QueryClient();
  const searchParams = await input.searchParams;
  const tab = isCharacterTab(searchParams?.tab) ? searchParams.tab : "character";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditCharacterView character={character} tab={tab} />
    </HydrationBoundary>
  );
};
