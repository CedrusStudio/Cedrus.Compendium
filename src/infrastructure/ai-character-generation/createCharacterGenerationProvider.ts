import 'server-only';
import type { CharacterGenerationProvider } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import { aiCharacterGenerationSettings } from '@/lib/env';
import {
  getLocalCharacterGenerationServerSettings,
  getOllamaCharacterGenerationServerSettings,
  getOpenAiCharacterGenerationServerSettings,
} from '@/lib/aiCharacterGenerationServerSettings';
import { OpenAiCharacterGenerationProvider } from '@/infrastructure/ai-character-generation/OpenAiCharacterGenerationProvider';
import { OllamaCharacterGenerationProvider } from '@/infrastructure/ai-character-generation/OllamaCharacterGenerationProvider';
import { LocalFileCharacterGenerationProvider } from '@/infrastructure/ai-character-generation/LocalFileCharacterGenerationProvider';

export class AiCharacterGenerationProviderUnavailableError extends Error
{
  constructor()
  {
    super('Selected AI character generation provider is not available.');
    this.name = 'AiCharacterGenerationProviderUnavailableError';
  }
}

export function createCharacterGenerationProvider(): CharacterGenerationProvider
{
  if (aiCharacterGenerationSettings.provider === 'openai') {
    return new OpenAiCharacterGenerationProvider({
      ...getOpenAiCharacterGenerationServerSettings(),
      model: aiCharacterGenerationSettings.openAiModel,
    });
  }

  if (aiCharacterGenerationSettings.provider === 'ollama' && aiCharacterGenerationSettings.ollamaModel) {
    return new OllamaCharacterGenerationProvider({
      ...getOllamaCharacterGenerationServerSettings(),
      model: aiCharacterGenerationSettings.ollamaModel,
    });
  }

  // The local provider runs no model, but the draft still records what produced
  // it, so the label is configurable rather than a hardcoded 'local'.
  if (aiCharacterGenerationSettings.provider === 'local') {
    return new LocalFileCharacterGenerationProvider({
      ...getLocalCharacterGenerationServerSettings(),
      model: aiCharacterGenerationSettings.localModelLabel,
    });
  }

  throw new AiCharacterGenerationProviderUnavailableError();
}
