/**
 * Thrown for expected, user-facing validation failures (e.g. an apiKey not
 * part of the configured admin pool, or a raceId that doesn't exist), as
 * opposed to unexpected/internal errors. Route handlers use this to decide
 * between returning a helpful 400 with the message, or a generic 500.
 *
 * Kept in its own module (not in charactersRepository.ts) because that file
 * has `'use server'` at the top, and Next.js only allows async functions to
 * be exported from a "use server" file — exporting a class there fails the
 * build with "Only async functions are allowed to be exported in a 'use
 * server' file."
 */
export class CharacterValidationError extends Error
{
  constructor(message: string)
  {
    super(message);
    this.name = 'CharacterValidationError';
  }
}
