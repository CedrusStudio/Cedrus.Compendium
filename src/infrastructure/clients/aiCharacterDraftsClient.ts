import client from '@/infrastructure/clients/baseClient';
import type { AiCharacterDraft } from '@/domain/ai-character-generation/aiCharacterDraft';
import type { AiCharacterGenerationRequest } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import type { BalanceComparison } from '@/domain/ai-character-generation/compareToBalanceProfile';
import type { AiCatalogSearchResult } from '@/domain/ai-character-generation/toAiCharacterCatalog';

const path = '/ai/character-drafts';
const catalogPath = '/ai/character-catalog';

const aiCharacterDraftsClient = {
  create: async (request: AiCharacterGenerationRequest): Promise<AiCharacterDraft> => {
    const response = await client.post(path, request);
    return response.data;
  },
  get: async (id: string): Promise<AiCharacterDraft> => {
    const response = await client.get(`${path}/${id}`);
    return response.data;
  },
  update: async (id: string, proposal: AiCharacterProposal): Promise<AiCharacterDraft> => {
    const response = await client.patch(`${path}/${id}`, proposal);
    return response.data;
  },
  balance: async (id: string): Promise<BalanceComparison[]> => {
    const response = await client.get(`${path}/${id}/balance`);
    return response.data;
  },
  /** Compendium entries of one kind whose name matches, for the draft editor. */
  catalog: async (kind: string, query: string): Promise<AiCatalogSearchResult[]> => {
    const response = await client.get(catalogPath, { params: { kind, query } });
    return response.data;
  },
  /** Clears the proposal waiting in the offline workspace (local provider only). */
  discardPreparedLocalDraft: async (): Promise<boolean> => {
    const response = await client.delete('/ai/local-draft');
    return Boolean(response.data?.removed);
  },
  reject: async (id: string): Promise<void> => {
    await client.delete(`${path}/${id}`);
  },
  accept: async (id: string): Promise<string> => {
    const response = await client.post(`${path}/${id}/accept`);
    return response.data.characterId;
  },
};

export default aiCharacterDraftsClient;
