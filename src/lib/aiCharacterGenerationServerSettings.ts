import 'server-only';
import path from 'node:path';
import { z } from 'zod';

const openAiCharacterGenerationServerSettingsSchema = z.object({
  apiKey: z.string().trim().min(1, 'OPENAI_API_KEY is required when OpenAI generation is enabled.'),
  maxOutputTokens: z.coerce.number().int().min(256).max(12_000).default(6_000),
  // Assembling a character from a four-hundred-entry catalog is a planning
  // task, and 'low' was leaving the model with barely enough budget to copy the
  // description's own words back as maneuvers.
  reasoningEffort: z.enum(['low', 'medium', 'high']).default('medium'),
  inputTokenMicroUsd: z.coerce.number().int().positive().default(1),
  outputTokenMicroUsd: z.coerce.number().int().positive().default(6),
});

export type OpenAiCharacterGenerationServerSettings = z.infer<typeof openAiCharacterGenerationServerSettingsSchema>;

const ollamaCharacterGenerationServerSettingsSchema = z.object({
  baseUrl: z.url().default('http://127.0.0.1:11434'),
});

export type OllamaCharacterGenerationServerSettings = z.infer<typeof ollamaCharacterGenerationServerSettingsSchema>;

const localCharacterGenerationServerSettingsSchema = z.object({
  workspaceDirectory: z.string().trim().min(1).default('ai-workspace'),
});

export type LocalCharacterGenerationServerSettings = z.infer<typeof localCharacterGenerationServerSettingsSchema>;

/**
 * Secret-only settings. This module must never be imported by a client
 * component or a route that serializes its return value.
 *
 * The defaults reflect the public pricing of gpt-5.6-luna at the time this
 * adapter was added: 1 and 6 micro-USD per input and output token.
 */
export function getOpenAiCharacterGenerationServerSettings(): OpenAiCharacterGenerationServerSettings
{
  return openAiCharacterGenerationServerSettingsSchema.parse({
    apiKey: process.env.OPENAI_API_KEY,
    maxOutputTokens: process.env.AI_OPENAI_MAX_OUTPUT_TOKENS,
    reasoningEffort: process.env.AI_OPENAI_REASONING_EFFORT,
    inputTokenMicroUsd: process.env.AI_OPENAI_INPUT_TOKEN_MICRO_USD,
    outputTokenMicroUsd: process.env.AI_OPENAI_OUTPUT_TOKEN_MICRO_USD,
  });
}

/** The provider URL is server-only configuration, never a browser input. */
export function getOllamaCharacterGenerationServerSettings(): OllamaCharacterGenerationServerSettings
{
  const settings = ollamaCharacterGenerationServerSettingsSchema.parse({
    baseUrl: process.env.OLLAMA_BASE_URL,
  });

  return { baseUrl: settings.baseUrl.replace(/\/$/, '') };
}

/**
 * The workspace path is resolved against the process working directory, so a
 * relative value stays inside the repository where `.gitignore` covers it.
 */
export function getLocalCharacterGenerationServerSettings(): LocalCharacterGenerationServerSettings
{
  const settings = localCharacterGenerationServerSettingsSchema.parse({
    workspaceDirectory: process.env.AI_LOCAL_WORKSPACE_DIR,
  });

  return { workspaceDirectory: path.resolve(process.cwd(), settings.workspaceDirectory) };
}
