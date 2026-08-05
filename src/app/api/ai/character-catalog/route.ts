import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { AI_CATALOG_KINDS } from '@/domain/ai-character-generation/toAiCharacterCatalog';
import { searchAiCharacterCatalog } from '@/persistence/ai-character-generation/aiCharacterCatalogRepository';

/**
 * Enough that a blank query lists a whole small kind — there are 44 races and
 * 11 shields — while still capping the populous ones. A maneuver search that
 * matched everything would otherwise try to ship 992 records to a browser.
 */
const MAX_RESULTS = 100;

/**
 * Compendium lookup for the draft reviewer, one kind at a time.
 *
 * It sits beside the drafts rather than under one, because what may be added to
 * a draft does not depend on the draft — the compendium is the compendium. That
 * also keeps it clear of the `[id]` segment, so a search can never be mistaken
 * for a draft whose identifier happens to read like a word.
 */
export async function GET(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') ?? '';
  const query = url.searchParams.get('query') ?? '';

  if (!(AI_CATALOG_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: `Nieznany rodzaj wpisu: ${kind}.` }, { status: 400 });
  }

  try {
    return NextResponse.json(await searchAiCharacterCatalog(kind, query, MAX_RESULTS));
  } catch (error) {
    console.error('Failed to search the AI character catalog:', error);
    return NextResponse.json({ error: 'Nie udało się przeszukać kompendium.' }, { status: 500 });
  }
}
