import type { CharacterVisibilityMode } from '@/common/global/SearchPayloads';

/**
 * Visibility rule for characters scoped to an API key (see
 * features-to-implement/visible-only-to-api-keys.md).
 *
 *   apiKeys == undefined -> public
 *   apiKeys == []         -> public
 *   apiKeys contains key  -> visible
 *   apiKeys contains other-> hidden
 *
 * This filter must be applied at the database (Prisma `where`) level for
 * list queries, and additionally checked in-memory for single-record lookups
 * by id (Mongo/Prisma `findUnique` cannot combine extra `where` conditions
 * with a unique-key lookup).
 *
 * On top of the base rule above, list queries can opt into a narrower
 * `CharacterVisibilityMode` (see
 * features-to-implement/character-visibility-filter-implementation-plan.md):
 *
 *   mode == "all"        -> apiKeys.isEmpty OR apiKeys has key   (base rule, default)
 *   mode == "publicOnly" -> apiKeys.isEmpty                      (regardless of key)
 *   mode == "mineOnly"   -> apiKeys has key                      (requires a key)
 */

export type CharacterVisibilityWhere =
  | { apiKeys: { isEmpty: true } }
  | { apiKeys: { has: string } }
  | { OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: string } }] };

/**
 * Normalizes a raw API key value (e.g. straight from a request header) to
 * either a non-empty trimmed string, or `null` when there effectively is no
 * key (missing, empty, or whitespace-only).
 */
export function normalizeApiKey(apiKey: string | null | undefined): string | null
{
  if (!apiKey) return null;
  const trimmed = apiKey.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Builds the Prisma `where` fragment enforcing character visibility for the
 * given (already normalized-or-not) API key, narrowed by `mode`.
 *
 * `mode: 'mineOnly'` requires a normalized API key — callers must check
 * `canUseMineOnlyVisibility(apiKey)` beforehand (see `searchEntity`, which
 * short-circuits to an empty result instead of ever reaching this branch
 * without a key). This throws rather than silently returning an always-false
 * `where`, so a future caller that skips the guard fails loudly.
 */
export function characterVisibilityWhere(apiKey: string | null | undefined, mode: CharacterVisibilityMode = 'all'): CharacterVisibilityWhere
{
  const normalizedApiKey = normalizeApiKey(apiKey);

  if (mode === 'publicOnly')
  {
    return { apiKeys: { isEmpty: true } };
  }

  if (mode === 'mineOnly')
  {
    if (!normalizedApiKey)
    {
      throw new Error('characterVisibilityWhere: mode "mineOnly" requires an API key.');
    }

    // `has` can never match an empty array, so this is already exclusive of
    // public characters without needing a separate `isEmpty: false` check.
    return { apiKeys: { has: normalizedApiKey } };
  }

  if (!normalizedApiKey)
  {
    return { apiKeys: { isEmpty: true } };
  }

  return {
    OR:
    [
      { apiKeys: { isEmpty: true } },
      { apiKeys: { has: normalizedApiKey } },
    ],
  };
}

/**
 * Whether `mode: 'mineOnly'` can be used for the given API key. Callers must
 * check this before invoking `characterVisibilityWhere(apiKey, 'mineOnly')`
 * and short-circuit to an empty result otherwise, instead of hitting the
 * database or the `throw` above.
 */
export function canUseMineOnlyVisibility(apiKey: string | null | undefined): boolean
{
  return normalizeApiKey(apiKey) !== null;
}

/**
 * In-memory equivalent of `characterVisibilityWhere`, used for single-record
 * lookups where the condition can't be pushed into the database query.
 */
export function isCharacterVisible(apiKeys: string[] | null | undefined, apiKey: string | null | undefined): boolean
{
  if (!apiKeys || apiKeys.length === 0) return true;

  const normalizedApiKey = normalizeApiKey(apiKey);
  if (!normalizedApiKey) return false;

  return apiKeys.includes(normalizedApiKey);
}
