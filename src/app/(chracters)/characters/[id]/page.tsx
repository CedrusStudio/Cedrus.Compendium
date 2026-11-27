import CharacterLoading from "@/application/characters/CharacterLoading";
import { Suspense } from "react";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import CharacterView from '@/application/characters/CharacterView';
import { isCharacterTab } from '@/common/tabsUtils';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import { searchEntityById } from '@/persistence/searchEntity';
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';

type CharacterPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function CharacterPage(props: CharacterPageProps)
{
  return (
    <Suspense fallback={<CharacterLoading />}>
      <CharacterContent {...props} />
    </Suspense>
  );
}

async function CharacterContent(props: CharacterPageProps)
{
  const params = await props.params;
  const searchParams = await props.searchParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => searchEntityById(params.id, characterQueryById),
  });

  const tab = isCharacterTab(searchParams.tab) ? searchParams.tab : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterView tab={tab} />
    </HydrationBoundary>
  );
};
