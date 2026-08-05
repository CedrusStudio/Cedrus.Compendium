import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { getAiCharacterDraftBalance } from '@/application/ai-character-generation/getAiCharacterDraftBalance';
import { AiCharacterDraftNotFoundError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';

type RouteParams = Promise<{ id: string }>;

/**
 * Read-only view of how the draft compares with the compendium. Separate from
 * the draft itself because it is derived from data that keeps changing, and
 * because a reviewer may want it refreshed without regenerating anything.
 */
export async function GET(request: Request, segmentData: { params: RouteParams }) {
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await segmentData.params;

  try {
    return NextResponse.json(await getAiCharacterDraftBalance({ draftId: id, apiKey: apiKeyOrResponse }));
  } catch (error) {
    if (error instanceof AiCharacterDraftNotFoundError) {
      return NextResponse.json({ error: 'AI character draft not found.' }, { status: 404 });
    }

    console.error('Failed to compare AI character draft with the compendium:', error);
    return NextResponse.json({ error: 'Nie udało się porównać wersji roboczej z kompendium.' }, { status: 500 });
  }
}
