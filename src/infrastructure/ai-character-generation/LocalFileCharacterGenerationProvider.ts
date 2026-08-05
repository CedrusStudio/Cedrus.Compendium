import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type {
  CharacterGenerationContext,
  CharacterGenerationProvider,
  CharacterGenerationProviderResult,
} from '@/domain/ai-character-generation/CharacterGenerationProvider';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import {
  buildCatalogIdentityIndex,
  normalizeAiProposalIdentifiers,
} from '@/domain/ai-character-generation/normalizeAiProposalIdentifiers';
import { stripWireNulls } from '@/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat';
import type { LocalCharacterGenerationServerSettings } from '@/lib/aiCharacterGenerationServerSettings';

export class LocalFileCharacterGenerationProviderError extends Error
{
  readonly reason: 'missing_draft' | 'unreadable_draft' | 'invalid_draft';

  constructor(message: string, reason: LocalFileCharacterGenerationProviderError['reason'])
  {
    super(message);
    this.name = 'LocalFileCharacterGenerationProviderError';
    this.reason = reason;
  }
}

const DRAFT_FILE_NAME = 'draft.json';

/**
 * Generates nothing. The draft is written by hand, outside the application,
 * using the full compendium dump that `dump-ai-character-context.ts` produces —
 * which is the whole point of the offline route, since the hosted prompt has to
 * fit the catalog into 120 000 characters and this does not.
 *
 * It deliberately does not wait for the file to appear. Polling would hold an
 * HTTP request open for however long the work takes, so a missing draft is an
 * immediate, instructive error and the flow is two steps: generate once to get
 * the context written out, prepare the draft, generate again to load it.
 *
 * Everything downstream is unchanged: the same identifier normalisation and the
 * same Zod contract decide whether the draft is usable, so a hand-written
 * proposal cannot smuggle in anything the OpenAI route could not.
 */
export class LocalFileCharacterGenerationProvider implements CharacterGenerationProvider
{
  readonly name = 'local';
  readonly model: string;

  private readonly workspaceDirectory: string;

  constructor(settings: LocalCharacterGenerationServerSettings & { model: string })
  {
    this.workspaceDirectory = settings.workspaceDirectory;
    this.model = settings.model;
  }

  /** Where the prepared proposal is expected. */
  get preparedDraftFile(): string
  {
    return path.join(this.workspaceDirectory, 'drafts', DRAFT_FILE_NAME);
  }

  /**
   * Throws the prepared draft away.
   *
   * Loading one deliberately does not consume it — a draft that vanished the
   * moment it was read would be unrecoverable if the review then went badly.
   * The cost of keeping it is that the next click loads the same character
   * again, silently, which is confusing enough to be worth an explicit
   * control rather than a note in a README.
   *
   * Returns whether there was anything to remove, so the caller can tell
   * „cleared" from „there was nothing there".
   */
  discardPreparedDraft(): boolean
  {
    if (!fs.existsSync(this.preparedDraftFile)) return false;

    fs.rmSync(this.preparedDraftFile);
    return true;
  }

  async generate(context: CharacterGenerationContext): Promise<CharacterGenerationProviderResult>
  {
    this.writeRequestContext(context);

    const draftFile = this.preparedDraftFile;
    if (!fs.existsSync(draftFile)) {
      throw new LocalFileCharacterGenerationProviderError(
        `Nie ma przygotowanej wersji roboczej. Kontekst tego żądania zapisano w ${path.join(this.workspaceDirectory, 'requests')}. `
        + `Przygotuj propozycję i zapisz ją jako ${draftFile}, potem spróbuj ponownie.`,
        'missing_draft',
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
    } catch {
      throw new LocalFileCharacterGenerationProviderError(
        `Plik ${draftFile} nie jest poprawnym JSON-em.`,
        'unreadable_draft',
      );
    }

    let proposal;
    try {
      proposal = aiCharacterProposalSchema.parse(
        normalizeAiProposalIdentifiers(stripWireNulls(parsed), {
          allowCustomEquipment: context.request.constraints.allowCustomEquipment,
          allowCustomAbilities: context.request.constraints.allowCustomAbilities,
          catalog: buildCatalogIdentityIndex(context.allowedCatalog.entries),
        }),
      );
    } catch (error) {
      const issues = typeof error === 'object' && error !== null && 'issues' in error
        ? (error as { issues?: unknown }).issues
        : undefined;
      console.error('Local character proposal failed validation:', issues ?? error);

      throw new LocalFileCharacterGenerationProviderError(
        `Plik ${draftFile} nie pasuje do formatu postaci. Szczegóły w logu serwera.`,
        'invalid_draft',
      );
    }

    // Nothing was bought, so nothing is charged. The budget reservation taken
    // before this call is released or completed by the caller either way.
    return {
      proposal,
      usage: { inputTokens: 0, outputTokens: 0 },
      costMicroUsd: 0,
    };
  }

  /**
   * Writing the context out is the useful half of a failed call: it is the
   * exact material the draft has to answer, including the catalog the request
   * was allowed to draw on.
   */
  private writeRequestContext(context: CharacterGenerationContext): void
  {
    try {
      const directory = path.join(this.workspaceDirectory, 'requests');
      fs.mkdirSync(directory, { recursive: true });

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(path.join(directory, `${stamp}.json`), JSON.stringify(context, null, 2));
    } catch (error) {
      // A workspace that cannot be written is worth reporting, but it must not
      // mask a draft that is already sitting there and ready to load.
      console.error('Could not write the local generation request context:', error);
    }
  }
}
