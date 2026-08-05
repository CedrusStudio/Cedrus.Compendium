import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import { searchEntityById } from '@/persistence/searchEntity';
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';
import { parseSheetOptions } from '@/domain/characters/sheet/sheetOptions';
import CharacterSheetView from '@/application/characters/sheet/CharacterSheetView';

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

/**
 * Printable character sheet at `/characters/:id/sheet`.
 *
 * Mirrors the prefetch of `(chracters)/characters/[id]/page.tsx` on purpose:
 * the server prefetch runs without an API key, so a character scoped to one
 * (`apiKeys`) comes back empty here and is re-fetched on the client, where
 * `useApiKey` supplies the key. Diverging from that pattern would render
 * private characters as a blank page.
 */
export default async function CharacterSheetPage(props: { params: Params, searchParams: SearchParams })
{
  const params = await props.params;
  const searchParams = await props.searchParams;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery
  ({
    queryKey: createCharacterByIdKey(params.id),
    queryFn: () => searchEntityById(params.id, characterQueryById),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CharacterSheetView options={parseSheetOptions(searchParams)} generatedOn={new Date()} />
    </HydrationBoundary>
  );
};
