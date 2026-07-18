/**
 * Thrown for expected, user-facing validation failures on Battle Presets
 * (preset limit reached, attempt to touch a preset owned by a different API
 * key), as opposed to unexpected/internal errors. Route handlers use this to
 * decide between a helpful 4xx with the message, or a generic 500.
 *
 * Kept in its own module (not in battlePresetsRepository.ts), mirroring
 * characterErrors.ts — a 'use server' file may only export async functions,
 * so an exported class has to live elsewhere.
 */
export class BattlePresetValidationError extends Error
{
  constructor(message: string)
  {
    super(message);
    this.name = 'BattlePresetValidationError';
  }
}

/**
 * Thrown when a preset id doesn't resolve to a record owned by the
 * requesting API key — either because it doesn't exist at all, or because
 * it belongs to a different key. The two cases are deliberately
 * indistinguishable to the caller (see "Otwarte pytania" in
 * battle-configurations-implementation-plan.md, question 2): surfacing a
 * distinct "forbidden" response would let a caller enumerate other keys'
 * preset ids by probing this endpoint.
 */
export class BattlePresetNotFoundError extends Error
{
  constructor(id: string)
  {
    super(`Battle preset ${id} not found.`);
    this.name = 'BattlePresetNotFoundError';
  }
}
