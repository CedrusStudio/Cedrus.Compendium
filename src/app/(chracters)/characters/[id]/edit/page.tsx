import CharacterLoading from "@/application/characters/CharacterLoading";
import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { isCharacterTab } from '@/common/tabsUtils';
import EditCharacterView from '@/application/characters/edit/EditCharacterView';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import { searchEntityById } from '@/persistence/searchEntity';
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';

type EditCharacterPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function EditPage(props: EditCharacterPageProps)
{
  return (
    <Suspense fallback={<CharacterLoading />}>
      <EditCharacterContent {...props} />
    </Suspense>
  );
}

async function EditCharacterContent(props: EditCharacterPageProps)
{
  const params = await props.params
  const searchParams = await props.searchParams
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery 
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => searchEntityById(params.id, characterQueryById),
  });

  const tab = isCharacterTab(searchParams.tab) ? searchParams.tab : "character";

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditCharacterView tab={tab} />
    </HydrationBoundary>
  );
};
