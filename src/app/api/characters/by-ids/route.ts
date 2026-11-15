import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { validateFormBody } from '@/app/api/validateFormBody';
import { characterIdsSchema } from '@/persistence/schemas/characters/characterIdsSchema';
import { getCharactersVisibleToApiKeyByIds } from '@/persistence/characters/charactersRepository';

export async function POST(request: Request) {
  const apiKey = getValidatedApiKey(request);
  if (typeof apiKey !== 'string') return apiKey;
  const parsed = validateFormBody(await request.json().catch(() => null), characterIdsSchema);
  if (!parsed.success) return parsed.response;
  try {
    const characters = await getCharactersVisibleToApiKeyByIds(parsed.data.ids, apiKey);
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error fetching characters by IDs:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
