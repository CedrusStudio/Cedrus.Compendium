import client, { extractServerErrorMessage } from '@/infrastructure/clients/baseClient';
import type { TagDefinitionRecord, TagFacetDefinition } from '@/domain/tags/tagFacets';
import type { TagFacetDrift } from '@/domain/tags/tagFacetDrift';

/**
 * Client for the category layer (Wave 10.5).
 *
 * Goes through `baseClient` rather than bare `fetch` for one non-obvious
 * reason: the proxy (`src/proxy.ts`) rejects EVERY non-GET request without the
 * `x-api-key` header, and only `baseClient`'s interceptor attaches it from
 * storage. The admin panel originally called `fetch` directly, so every save
 * failed with "API key is required" no matter how valid the user's key was.
 */

export type TagFacetLayer = { facets: TagFacetDefinition[]; definitions: TagDefinitionRecord[] };

export type FacetUpsert =
{
  key: string;
  label?: string;
  description?: string | null;
  order?: number;
  selectionMode?: string;
  supportsNone?: boolean;
  entities?: string[];
};

export type DefinitionUpsert =
{
  tag: string;
  facetKey?: string | null;
  label?: string | null;
  order?: number | null;
  aliases?: { alias: string; entities: string[] }[];
};

/** Server-side validation messages (alias rules) are surfaced verbatim — they name the exact conflict. */
export class TagFacetError extends Error {}

const post = async (body: Record<string, unknown>): Promise<void> =>
{
  try
  {
    await client.post('/tag-facets/admin', body);
  }
  catch (error)
  {
    throw new TagFacetError(extractServerErrorMessage(error as { response?: { data?: unknown } }) ?? 'Nie udało się zapisać.');
  }
};

const tagFacetsClient =
{
  getLayer: async (): Promise<TagFacetLayer> => (await client.get<TagFacetLayer>('/tag-facets/admin')).data,
  getDrift: async (): Promise<TagFacetDrift> => (await client.get<TagFacetDrift>('/tag-facets/drift')).data,

  upsertFacet: (facet: FacetUpsert) => post({ resource: 'facet', action: 'upsert', ...facet }),
  deleteFacet: (key: string) => post({ resource: 'facet', action: 'delete', key }),

  upsertDefinition: (definition: DefinitionUpsert) => post({ resource: 'definition', action: 'upsert', ...definition }),
  deleteDefinition: (tag: string) => post({ resource: 'definition', action: 'delete', tag }),
};

export default tagFacetsClient;
