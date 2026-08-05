import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { aiCharacterGenerationSettings } from '@/lib/env';
import { getLocalCharacterGenerationServerSettings } from '@/lib/aiCharacterGenerationServerSettings';
import { LocalFileCharacterGenerationProvider } from '@/infrastructure/ai-character-generation/LocalFileCharacterGenerationProvider';

/**
 * The prepared proposal waiting in the offline workspace.
 *
 * It sits beside the drafts rather than under one because it is not a draft:
 * nothing has been generated from it yet, it has no identifier, and it belongs
 * to the workspace on disk rather than to the database.
 */

/**
 * Throws away the prepared proposal.
 *
 * Loading a draft leaves the file in place on purpose, so a review that goes
 * wrong is recoverable. The consequence is that the next click loads the same
 * character again — which looks like the application ignoring the request
 * rather than doing exactly what it was told, so clearing it is a button.
 */
export async function DELETE(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  if (aiCharacterGenerationSettings.provider !== 'local') {
    return NextResponse.json(
      { error: 'Przygotowana wersja robocza istnieje tylko w trybie lokalnym.' },
      { status: 409 },
    );
  }

  try {
    const provider = new LocalFileCharacterGenerationProvider({
      ...getLocalCharacterGenerationServerSettings(),
      model: aiCharacterGenerationSettings.localModelLabel,
    });

    return NextResponse.json({ removed: provider.discardPreparedDraft() });
  } catch (error) {
    console.error('Failed to discard the prepared local draft:', error);
    return NextResponse.json({ error: 'Nie udało się usunąć przygotowanej wersji roboczej.' }, { status: 500 });
  }
}
