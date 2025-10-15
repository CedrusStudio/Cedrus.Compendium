import { z } from 'zod';

export const supportedLanguages = [
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
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

export const languageSettings = parseLanguageEnvironmentVariables();