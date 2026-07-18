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
 */

export type CharacterVisibilityWhere =
  | { apiKeys: { isEmpty: true } }
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
 * given (already normalized-or-not) API key.
 */
export function characterVisibilityWhere(apiKey: string | null | undefined): CharacterVisibilityWhere
{
  const normalizedApiKey = normalizeApiKey(apiKey);

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
