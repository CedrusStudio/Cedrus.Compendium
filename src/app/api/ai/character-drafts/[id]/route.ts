import { NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import {
  getAiCharacterDraftById,
  rejectAiCharacterDraft,
} from '@/persistence/ai-character-generation/aiCharacterDraftRepository';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import {
  AiCharacterDraftEditRejectedError,
  updateAiCharacterDraft,
} from '@/application/ai-character-generation/updateAiCharacterDraft';

type RouteParams = Promise<{ id: string }>;

export async function GET(request: Request, segmentData: { params: RouteParams }) {
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await segmentData.params;
  const draft = await getAiCharacterDraftById(id, hashApiKey(apiKeyOrResponse));
  if (!draft) return NextResponse.json({ error: 'AI character draft not found.' }, { status: 404 });

  return NextResponse.json(draft);
}

export async function PATCH(request: Request, segmentData: { params: RouteParams }) {
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await segmentData.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowa treść żądania.' }, { status: 400 });
  }

  const parsed = aiCharacterProposalSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Poprawiona wersja robocza nie pasuje do formatu postaci.' }, { status: 400 });
  }

  try {
    const draft = await updateAiCharacterDraft({ draftId: id, apiKey: apiKeyOrResponse, proposal: parsed.data });
    return NextResponse.json(draft);
  } catch (error) {
    if (error instanceof AiCharacterDraftNotFoundError) {
      return NextResponse.json({ error: 'AI character draft not found.' }, { status: 404 });
    }
    if (error instanceof AiCharacterDraftEditRejectedError) {
      return NextResponse.json({ error: error.issues.join(' ') }, { status: 400 });
    }
    if (error instanceof AiCharacterDraftStateError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Failed to update AI character draft:', error);
    return NextResponse.json({ error: 'Nie udało się zapisać zmian w wersji roboczej.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, segmentData: { params: RouteParams }) {
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await segmentData.params;
  try {
    await rejectAiCharacterDraft(id, hashApiKey(apiKeyOrResponse));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AiCharacterDraftNotFoundError) {
      return NextResponse.json({ error: 'AI character draft not found.' }, { status: 404 });
    }
    if (error instanceof AiCharacterDraftStateError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to reject AI character draft.' }, { status: 500 });
  }
}
