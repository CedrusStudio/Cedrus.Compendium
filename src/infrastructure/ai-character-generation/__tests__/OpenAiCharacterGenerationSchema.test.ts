import { describe, expect, it } from 'vitest';
import { openAiCharacterProposalResponseFormat } from '@/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat';

describe('OpenAI character proposal schema', () => {
  it('converts the application input contract to a strict OpenAI structured-output format', () => {
    expect(openAiCharacterProposalResponseFormat).toMatchObject({
      type: 'json_schema',
      name: 'ai_character_proposal',
      strict: true,
    });
    expect(openAiCharacterProposalResponseFormat.schema).toMatchObject({
      type: 'object',
      additionalProperties: false,
    });
  });
});
