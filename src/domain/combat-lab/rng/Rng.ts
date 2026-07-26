/**
 * Deterministic, seedable pseudo-random number generator for the Combat Lab.
 *
 * Rationale (see features-to-implement/combat-simulator-implementation-plan.md,
 * "Determinizm"): the whole simulator must be reproducible — the same seed and
 * the same inputs must produce the same fight, otherwise Combat Replay and
 * balance reports are impossible. `Math.random()` is non-deterministic and
 * cannot be seeded, so every roll inside the engine goes through an injected
 * `Rng` instead.
 *
 * This module has ZERO dependencies on React/Next/Prisma — it is pure domain.
 */

/**
 * A minimal random source: a function returning a float in [0, 1).
 *
 * Kept as a bare function type (not `Rng`) so that low-level roll helpers in
 * `characters/combat/Offense.ts` can accept randomness without importing the
 * whole `combat-lab` layer — that would invert the dependency direction
 * (characters must not depend on combat-lab). `Math.random` and `Rng.next`
 * both satisfy this type.
 */
export type RandomSource = () => number;

/**
 * Deterministic random generator. `next()` mirrors `Math.random()` semantics
 * (float in [0, 1)) so it is a drop-in replacement anywhere a `RandomSource`
 * is expected (pass `rng.next`).
 */
export interface Rng
{
  /** Next float in [0, 1). */
  next(): number;
  /** Next integer in [0, maxExclusive). Throws if maxExclusive <= 0. */
  nextInt(maxExclusive: number): number;
  /** Inclusive integer in [min, max]. */
  nextIntInclusive(min: number, max: number): number;
  /** The seed this generator was created with (for logging/repro). */
  readonly seed: number;
}

/**
 * mulberry32 — a fast, well-distributed 32-bit PRNG. Chosen for being tiny,
 * dependency-free, and deterministic across environments (only uses `Math.imul`
 * and 32-bit int ops, no platform-dependent float state).
 */
function mulberry32(seedState: number): () => number
{
  let a = seedState | 0;

  return function next(): number
  {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a deterministic RNG from a seed. Two RNGs with the same seed emit
 * identical sequences.
 */
export function createRng(seed: number): Rng
{
  const next = mulberry32(seed);

  return {
    seed,
    next,
    nextInt(maxExclusive: number): number
    {
      if (maxExclusive <= 0)
      {
        throw new Error(`nextInt requires maxExclusive > 0, got ${maxExclusive}`);
      }
      return Math.floor(next() * maxExclusive);
    },
    nextIntInclusive(min: number, max: number): number
    {
      if (max < min)
      {
        throw new Error(`nextIntInclusive requires max >= min, got [${min}, ${max}]`);
      }
      return min + Math.floor(next() * (max - min + 1));
    },
  };
}

/**
 * Non-deterministic RNG backed by `Math.random`. Used as the default outside
 * the deterministic engine (e.g. the interactive `useCombatRolls` hook), so
 * existing behaviour is unchanged. Do NOT use inside the simulation loop.
 */
export const mathRandomRng: Rng = {
  seed: NaN,
  next: () => Math.random(),
  nextInt: (maxExclusive: number) =>
  {
    if (maxExclusive <= 0)
    {
      throw new Error(`nextInt requires maxExclusive > 0, got ${maxExclusive}`);
    }
    return Math.floor(Math.random() * maxExclusive);
  },
  nextIntInclusive: (min: number, max: number) =>
  {
    if (max < min)
    {
      throw new Error(`nextIntInclusive requires max >= min, got [${min}, ${max}]`);
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  },
};
