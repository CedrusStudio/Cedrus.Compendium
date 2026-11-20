import { readCreation } from '@/application/mcp/readCreation';
import { auditInput, gearGroups, profileGroups } from '@/domain/mcp/sheetContracts';
import { auditCharacter } from '@/application/mcp/sheetAudit';
import { editCapabilities } from '@/application/mcp/editCapabilities';
import { verificationSections } from '@/application/mcp/sheetRead';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { applyInput, changeInput, contextInput, createInput, editInput } from '@/domain/mcp/writeContracts';
import { creationContext, previewCreation } from '@/application/mcp/create';
import { applyEdit, previewEdit, readEdit } from '@/application/mcp/edit';
import { acceptAiCharacterDraft } from '@/application/ai-character-generation/acceptAiCharacterDraft';
import { AiCharacterDraftAcceptanceConflictError } from '@/persistence/ai-character-generation/aiCharacterDraftAcceptanceErrors';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { AiCharacterReferenceUnavailableError } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { CharacterMembershipError } from '@/persistence/characters/characterMembershipErrors';
import { z } from 'zod';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { entryInput, searchInput } from '@/domain/mcp/readContracts';
import { searchEntries, readEntry } from '@/application/mcp/read';
import { CompendiumToolError } from '@/application/mcp/errors';

export async function POST(request: Request, { params }: { params: Promise<{ tool: string }> }) {
  if (process.env.COMPENDIUM_MCP_ENABLED !== 'true') return NextResponse.json({ error: 'Compendium MCP is disabled.' }, { status: 404 });
  const key = getValidatedApiKey(request);
  if (typeof key !== 'string') return key;
  const { tool } = await params;
  if (Number(request.headers.get('content-length')) > 2_000_000)
    return NextResponse.json({ error: 'MCP payload exceeds 2 MB.' }, { status: 413 });
  try {
    const input: unknown = await request.json().catch(() => { throw new CompendiumToolError(400, 'Invalid JSON.'); });
    switch (tool) {
      case 'get_status':
        z.strictObject({}).parse(input);
        return NextResponse.json({ version: 2, tools: ['get_status', 'search', 'get_entry', 'get_creation_context', 'preview_create', 'preview_edit', 'get_change', 'apply_change','audit_character'],
          capabilities: { characterDetail: ['summary','full'], ...editCapabilities(),
            gearGroups, profileGroups, catalogWrites: false } });
      case 'audit_character': return NextResponse.json(await auditCharacter(auditInput.parse(input),key));
      case 'search': return NextResponse.json(await searchEntries(searchInput.parse(input), key));
      case 'get_entry': return NextResponse.json(await readEntry(entryInput.parse(input), key));
      case 'get_creation_context': return NextResponse.json(await creationContext(contextInput.parse(input), key));
      case 'preview_create': return NextResponse.json(await previewCreation(createInput.parse(input), key));
      case 'preview_edit': return NextResponse.json(await previewEdit(editInput.parse(input), key));
      case 'get_change': {
        const { changeId } = changeInput.parse(input);
        return NextResponse.json(changeId.startsWith('edit-') ? await readEdit(changeId, key) : await readCreation(changeId, key));
      }
      case 'apply_change': {
        const { changeId, revision } = applyInput.parse(input);
        if (changeId.startsWith('edit-')) {
          const saved = await applyEdit(changeId, revision, key);
          const lookup = { kind: 'character', id: saved.characterId, detail: 'full', sections: verificationSections(saved.differences) } as const;
          // Acceptance is durable even if a subsequent normal read fails.
          const readback = await readEntry(lookup, key).catch(() => null);
          return NextResponse.json({ ...saved, verification: readback ? { status:'read', card:readback } : { status:'unavailable', retry:lookup } });
        }
        const draft = await readCreation(changeId, key);
        if (draft.revision !== revision) throw new CompendiumToolError(409, 'Review the current revision.');
        const characterId = await acceptAiCharacterDraft({ draftId: changeId, apiKey: key, reviewedRevision: revision });
        return NextResponse.json({ changeId, revision, status: 'accepted', characterId, href: '/characters/' + characterId });
      }
      default: throw new CompendiumToolError(404, 'Unknown tool.');
    }
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: z.prettifyError(error) }, { status: 400 });
    if (error instanceof AiCharacterDraftNotFoundError || error instanceof AiCharacterReferenceUnavailableError)
      return NextResponse.json({ error: 'Entry unavailable.' }, { status: 404 });
    if (error instanceof AiCharacterDraftAcceptanceConflictError) return NextResponse.json({ error: error.issues.join('\n') }, { status: 409 });
    if (error instanceof AiCharacterDraftStateError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034', 'P2025'].includes(error.code))
      return NextResponse.json({ error: 'Concurrent change or name conflict. Read the draft and retry.' }, { status: 409 });
    if (error instanceof CharacterMembershipError || error instanceof CompendiumToolError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Compendium could not complete this operation.' }, { status: 500 });
  }
}
