import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';
import { createKeysetSearchSpellsKey } from "@/persistence/cacheKeys";
import { getSearchQuery } from "@/common/global/httpUtils";
import { searchEntity } from "@/persistence/searchEntity";
import ItemListSkeleton from "@/common/components/skeletons/ItemListSkeleton";
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import SpellsList from '@/application/compendium/spells/SpellsList';
import { Spell } from '@/domain/characters/combat/Power';

type SpellsPageProps = 
{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default function SpellsPage(input: SpellsPageProps)
{
  return (
    <Suspense fallback={<ItemListSkeleton />}>
      <SpellsContent {...input} />
    </Suspense>
  );
}

async function SpellsContent(input: SpellsPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = getSearchQuery(searchParams);
  const spellsQuery = createSpellKeysetQuery(searchQuery);
  const queryKey = createKeysetSearchSpellsKey(searchQuery);

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery<Spell[]>
  ({
    queryKey: queryKey,
    queryFn: () => searchEntity<Spell>(spellsQuery),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SpellsList />
    </HydrationBoundary>
  );
};