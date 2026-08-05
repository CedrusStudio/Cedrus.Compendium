import { z } from 'zod';

export const supportedLanguages = 
[
  'pl-PL',
  'en-US', 
  'fr-FR',
  'de-DE',
  'it-IT',
  'es-ES'
] as const satisfies readonly string[];

export type Language = typeof supportedLanguages[number];

const languageSchema = z.object
({
  NEXT_LANGUAGE: z.enum(supportedLanguages).default('pl-PL'),
  NEXT_LANGUAGE_FALLBACK: z.enum(supportedLanguages).default('en-US'),
});

const parseLanguageEnvironmentVariables = () => 
{
  const parsed = languageSchema.safeParse(process.env);

  if (!parsed.success) 
  {
    console.error('❌ Invalid environment variables:', z.treeifyError(parsed.error));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

export const languageSettings = parseLanguageEnvironmentVariables();

const splitConfiguredApiKeys = (value: string | undefined) =>
{
  if (!value) return [];

  return value
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);
};

export const adminApiKeys = splitConfiguredApiKeys(process.env.NEXT_API_KEYS);
const booleanEnvironmentSchema = z.enum(['true', 'false']).default('false').transform(value => value === 'true');

export const aiCharacterGenerationSettingsSchema = z.object({
  enabled: booleanEnvironmentSchema,
  provider: z.enum(['openai', 'ollama', 'local']).default('openai'),
  openAiModel: z.string().trim().min(1).default('gpt-5.6-luna'),
  ollamaModel: z.string().trim().min(1).optional(),
  // The local provider calls nothing; the label only records what the draft was
  // prepared with, so it stays visible next to the OpenAI and Ollama models.
  localModelLabel: z.string().trim().min(1).max(200).default('local-file'),
  monthlyLimitMicroUsd: z.coerce.number().int().positive().default(5_000_000),
  dailyLimitMicroUsd: z.coerce.number().int().positive().default(500_000),
  maxGenerationsPerDay: z.coerce.number().int().positive().default(5),
  maxRequestCostMicroUsd: z.coerce.number().int().positive().default(200_000),
  maxReferences: z.coerce.number().int().min(0).max(3).default(3),
  maxDescriptionChars: z.coerce.number().int().positive().max(10_000).default(4_000),
  draftTtlHours: z.coerce.number().int().positive().max(168).default(24),
}).superRefine((settings, context) => {
  if (settings.maxRequestCostMicroUsd > settings.dailyLimitMicroUsd) {
    context.addIssue({
      code: 'custom',
      path: ['maxRequestCostMicroUsd'],
      message: 'AI_MAX_REQUEST_COST_MICRO_USD cannot exceed AI_DAILY_LIMIT_MICRO_USD.',
    });
  }

  if (settings.dailyLimitMicroUsd > settings.monthlyLimitMicroUsd) {
    context.addIssue({
      code: 'custom',
      path: ['dailyLimitMicroUsd'],
      message: 'AI_DAILY_LIMIT_MICRO_USD cannot exceed AI_MONTHLY_LIMIT_MICRO_USD.',
    });
  }

  if (settings.enabled && settings.provider === 'openai' && !settings.openAiModel) {
    context.addIssue({
      code: 'custom',
      path: ['openAiModel'],
      message: 'AI_OPENAI_MODEL is required when OpenAI character generation is enabled.',
    });
  }

  if (settings.enabled && settings.provider === 'ollama' && !settings.ollamaModel) {
    context.addIssue({
      code: 'custom',
      path: ['ollamaModel'],
      message: 'OLLAMA_MODEL is required when Ollama character generation is enabled.',
    });
  }
});

export type AiCharacterGenerationSettings = z.infer<typeof aiCharacterGenerationSettingsSchema>;

export const aiCharacterGenerationSettings = aiCharacterGenerationSettingsSchema.parse({
  enabled: process.env.AI_CHARACTER_GENERATION_ENABLED,
  provider: process.env.AI_CHARACTER_PROVIDER,
  openAiModel: process.env.AI_OPENAI_MODEL,
  ollamaModel: process.env.OLLAMA_MODEL,
  localModelLabel: process.env.AI_LOCAL_MODEL_LABEL,
  monthlyLimitMicroUsd: process.env.AI_MONTHLY_LIMIT_MICRO_USD,
  dailyLimitMicroUsd: process.env.AI_DAILY_LIMIT_MICRO_USD,
  maxGenerationsPerDay: process.env.AI_MAX_GENERATIONS_PER_DAY,
  maxRequestCostMicroUsd: process.env.AI_MAX_REQUEST_COST_MICRO_USD,
  maxReferences: process.env.AI_MAX_REFERENCES,
  maxDescriptionChars: process.env.AI_MAX_DESCRIPTION_CHARS,
  draftTtlHours: process.env.AI_DRAFT_TTL_HOURS,
});
