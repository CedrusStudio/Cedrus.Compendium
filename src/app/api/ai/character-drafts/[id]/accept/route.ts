import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { acceptAiCharacterDraft } from '@/application/ai-character-generation/acceptAiCharacterDraft';
import { AiCharacterReferenceUnavailableError } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { AiCharacterDraftAcceptanceConflictError } from '@/persistence/ai-character-generation/aiCharacterDraftAcceptanceErrors';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await params;
  try {
    const characterId = await acceptAiCharacterDraft({ draftId: id, apiKey: apiKeyOrResponse });
    return NextResponse.json({ characterId }, { status: 201 });
  } catch (error) {
    if (error instanceof AiCharacterDraftNotFoundError) {
      return NextResponse.json({ error: 'AI character draft not found.' }, { status: 404 });
    }
    if (error instanceof AiCharacterDraftAcceptanceConflictError) {
      return NextResponse.json({ error: error.message, issues: error.issues }, { status: 409 });
    }
    if (error instanceof AiCharacterDraftStateError || error instanceof AiCharacterReferenceUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to accept AI character draft.' }, { status: 500 });
  }
}
