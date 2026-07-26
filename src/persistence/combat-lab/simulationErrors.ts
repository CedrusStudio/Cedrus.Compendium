/**
 * Expected, user-facing errors for saved simulations. Kept in their own module
 * (not the repository) because a 'use server' file may only export async
 * functions — mirrors battlePresetErrors.ts.
 */

export class SimulationValidationError extends Error
{
  constructor(message: string)
  {
    super(message);
    this.name = 'SimulationValidationError';
  }
}

/**
 * Thrown when an id doesn't resolve to a record owned by the requesting API
 * key — either it doesn't exist or belongs to another key. The two cases are
 * deliberately indistinguishable so a caller can't enumerate other keys' ids.
 */
export class SimulationNotFoundError extends Error
{
  constructor(id: string)
  {
    super(`Simulation ${id} not found.`);
    this.name = 'SimulationNotFoundError';
  }
}
